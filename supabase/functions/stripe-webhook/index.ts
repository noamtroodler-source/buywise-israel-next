import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const stripe = new Stripe(stripeKey);
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response(JSON.stringify({ error: "No signature" }), {
      status: 400,
    });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
    });
  }

  console.log(`Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata || {};

        if (meta.type === "credit_purchase") {
          // One-time credit purchase
          const credits = parseInt(meta.credits || "0");
          if (credits > 0) {
            await adminClient.rpc("record_credit_purchase", {
              p_entity_type: meta.entity_type,
              p_entity_id: meta.entity_id,
              p_amount: credits,
              p_transaction_type: "purchase",
              p_credit_type: "unrestricted",
              p_reference_id: null,
              p_description: `Credit package purchase (${credits} credits)`,
            });
          }
        } else if (session.mode === "subscription") {
          // Subscription checkout - create subscription row
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : (session.subscription as any)?.id;

          // Determine entity_id: look up from agency or developer by user_id
          let entityId = meta.entity_id;
          if (!entityId && meta.user_id) {
            if (meta.entity_type === "agency") {
              const { data } = await adminClient
                .from("agencies")
                .select("id")
                .eq("admin_user_id", meta.user_id)
                .single();
              entityId = data?.id;
            } else if (meta.entity_type === "developer") {
              const { data } = await adminClient
                .from("developers")
                .select("id")
                .eq("user_id", meta.user_id)
                .single();
              entityId = data?.id;
            }
          }

          if (entityId) {
            const { error: insertErr } = await adminClient
              .from("subscriptions")
              .upsert(
                {
                  entity_type: meta.entity_type,
                  entity_id: entityId,
                  plan_id: meta.plan_id,
                  billing_cycle: meta.billing_cycle || "monthly",
                  status: "active",
                  stripe_customer_id: session.customer as string,
                  stripe_subscription_id: subId,
                  created_by: meta.user_id,
                },
                { onConflict: "entity_type,entity_id" }
              );

            if (insertErr) {
              console.error("Failed to upsert subscription:", insertErr);
            }

            // Handle promo code redemption
            if (meta.promo_code_id) {
              // Get the subscription we just created
              const { data: sub } = await adminClient
                .from("subscriptions")
                .select("id")
                .eq("entity_type", meta.entity_type)
                .eq("entity_id", entityId)
                .single();

              if (sub) {
                await adminClient
                  .from("subscription_promo_redemptions")
                  .insert({
                    subscription_id: sub.id,
                    promo_code_id: meta.promo_code_id,
                    credit_months_granted: 0,
                  });

                // Increment times_redeemed
                await adminClient.rpc("increment_promo_redemptions", {
                  p_promo_id: meta.promo_code_id,
                });
              }
            }
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : (invoice.subscription as any)?.id;

        if (subId) {
          // Update subscription period
          await adminClient
            .from("subscriptions")
            .update({
              status: "active",
              current_period_start: new Date(
                (invoice as any).lines?.data?.[0]?.period?.start * 1000 ||
                  Date.now()
              ).toISOString(),
              current_period_end: new Date(
                (invoice as any).lines?.data?.[0]?.period?.end * 1000 ||
                  Date.now()
              ).toISOString(),
            })
            .eq("stripe_subscription_id", subId);

          // Check for promo credit grants
          const { data: sub } = await adminClient
            .from("subscriptions")
            .select("id, entity_type, entity_id")
            .eq("stripe_subscription_id", subId)
            .single();

          if (sub) {
            const { data: redemptions } = await adminClient
              .from("subscription_promo_redemptions")
              .select("*, promo_codes(*)")
              .eq("subscription_id", sub.id);

            if (redemptions) {
              for (const redemption of redemptions) {
                const promo = (redemption as any).promo_codes;
                if (!promo?.credit_schedule) continue;

                const schedule = promo.credit_schedule as number[];
                const monthIndex = redemption.credit_months_granted;

                if (monthIndex < schedule.length && schedule[monthIndex] > 0) {
                  // Grant credits
                  await adminClient.rpc("record_credit_purchase", {
                    p_entity_type: sub.entity_type,
                    p_entity_id: sub.entity_id,
                    p_amount: schedule[monthIndex],
                    p_transaction_type: "promo_grant",
                    p_credit_type: promo.credit_type || "unrestricted",
                    p_description: `Promo ${promo.code} - month ${monthIndex + 1} credit grant`,
                  });

                  // Update months granted
                  await adminClient
                    .from("subscription_promo_redemptions")
                    .update({
                      credit_months_granted: monthIndex + 1,
                    })
                    .eq("id", redemption.id);
                }
              }
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : (invoice.subscription as any)?.id;

        if (subId) {
          await adminClient
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", subId);

          // Send payment failed email
          try {
            const { data: sub } = await adminClient
              .from("subscriptions")
              .select("entity_type, entity_id")
              .eq("stripe_subscription_id", subId)
              .single();

            if (sub) {
              let recipientEmail: string | null = null;
              if (sub.entity_type === "agency") {
                const { data } = await adminClient.from("agencies").select("email").eq("id", sub.entity_id).single();
                recipientEmail = data?.email || null;
              } else if (sub.entity_type === "developer") {
                const { data } = await adminClient.from("developers").select("email").eq("id", sub.entity_id).single();
                recipientEmail = data?.email || null;
              }

              if (recipientEmail) {
                const resendApiKey = Deno.env.get("RESEND_API_KEY");
                if (resendApiKey) {
                  const resend = new Resend(resendApiKey);
                  await resend.emails.send({
                    from: "BuyWise Israel <hello@buywiseisrael.com>",
                    to: [recipientEmail],
                    subject: "Your payment didn't go through — BuyWise Israel",
                    html: `
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
                        <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Your payment didn't go through</h1>
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">We tried to process your subscription payment, but it didn't go through. This can happen for a number of reasons — expired card, insufficient funds, etc.</p>
                        <div style="margin-top: 16px; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
                          <p style="margin: 0; color: #2563eb; font-weight: 500;">Please update your payment method to keep your subscription active.</p>
                        </div>
                        <p style="margin-top: 24px; color: #666; font-size: 14px;">If you believe this is an error, just reply to this email and we'll sort it out.</p>
                        <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                          Questions? Just reply — we read every email.<br>
                          <span style="color: #666; font-style: italic;">— Your friends at BuyWise Israel</span>
                        </p>
                      </div>
                    `,
                  });
                }
              }
            }
          } catch (emailErr) {
            console.error("Failed to send payment failed email:", emailErr);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await adminClient
          .from("subscriptions")
          .update({
            status: subscription.status === "active" ? "active" : subscription.status === "trialing" ? "trialing" : subscription.status === "past_due" ? "past_due" : "canceled",
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await adminClient
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        // Send cancellation email
        try {
          const { data: sub } = await adminClient
            .from("subscriptions")
            .select("entity_type, entity_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (sub) {
            let recipientEmail: string | null = null;
            if (sub.entity_type === "agency") {
              const { data } = await adminClient.from("agencies").select("email").eq("id", sub.entity_id).single();
              recipientEmail = data?.email || null;
            } else if (sub.entity_type === "developer") {
              const { data } = await adminClient.from("developers").select("email").eq("id", sub.entity_id).single();
              recipientEmail = data?.email || null;
            }

            if (recipientEmail) {
              const resendApiKey = Deno.env.get("RESEND_API_KEY");
              if (resendApiKey) {
                const resend = new Resend(resendApiKey);
                await resend.emails.send({
                  from: "BuyWise Israel <hello@buywiseisrael.com>",
                  to: [recipientEmail],
                  subject: "Your subscription has been canceled — BuyWise Israel",
                  html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
                      <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Your subscription has been canceled</h1>
                      <p style="color: #333; font-size: 16px; line-height: 1.6;">We're sorry to see you go. Your subscription has been canceled and you'll retain access until the end of your current billing period.</p>
                      <div style="margin-top: 16px; padding: 16px; background-color: #eff6ff; border-radius: 8px;">
                        <p style="margin: 0; color: #2563eb; font-weight: 500;">Changed your mind? You can resubscribe anytime from your dashboard.</p>
                      </div>
                      <p style="margin-top: 24px; color: #666; font-size: 14px;">If there's anything we could have done better, we'd love to hear your feedback — just reply to this email.</p>
                      <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                        Questions? Just reply — we read every email.<br>
                        <span style="color: #666; font-style: italic;">— Your friends at BuyWise Israel</span>
                      </p>
                    </div>
                  `,
                });
              }
            }
          }
        } catch (emailErr) {
          console.error("Failed to send cancellation email:", emailErr);
        }
        break;
      }
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err);
    return new Response(JSON.stringify({ error: "Webhook handler error" }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
