import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, company_name, entity_type, phone, message } = await req.json();

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const adminEmail = 'hello@buywiseisrael.com';

    const entityLabel = entity_type === 'agency' ? 'Agency' : 'Developer';
    const phoneLine = phone ? `<p><strong>Phone:</strong> ${phone}</p>` : '';
    const messageLine = message
      ? `<div style="background:#f9fafb;border-left:4px solid #2563eb;padding:12px 16px;margin-top:8px;border-radius:0 4px 4px 0;"><strong>Message:</strong><br/>${message}</div>`
      : '<p style="color:#6b7280"><em>No message provided</em></p>';

    const emailBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;color:#111827;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:#2563eb;color:white;padding:20px 24px;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:20px">🏢 New Enterprise Inquiry</h1>
    <p style="margin:4px 0 0;opacity:0.85;font-size:14px">A prospect has submitted an enterprise sales inquiry</p>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
    ${phoneLine}
    <p><strong>Company:</strong> ${company_name}</p>
    <p><strong>Type:</strong> ${entityLabel}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
    <p style="margin-bottom:4px"><strong>Their message:</strong></p>
    ${messageLine}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
    <p style="text-align:center">
      <a href="https://id-preview--c2825a5a-308c-4063-aa40-440c22a34359.lovable.app/admin/enterprise-inquiries"
         style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">
        View in Admin Panel →
      </a>
    </p>
    <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:16px">
      Questions? Just reply — we read every email. — Your friends at BuyWise Israel
    </p>
  </div>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'BuyWise Israel <hello@buywiseisrael.com>',
        to: [adminEmail],
        subject: `New Enterprise Inquiry from ${company_name} (${entityLabel})`,
        html: emailBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('enterprise-inquiry-notify error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
