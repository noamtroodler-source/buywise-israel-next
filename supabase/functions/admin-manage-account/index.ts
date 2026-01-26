import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  action: "delete" | "ban" | "unban";
  userId: string;
  banDuration?: "1d" | "1w" | "1m" | "permanent";
  reason?: string;
  entityType?: "user" | "agent" | "developer" | "agency";
  entityId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token for verification
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user's JWT and get their claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminUserId = claimsData.claims.sub;

    // Use service role client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const { data: hasAdminRole } = await adminClient.rpc("has_role", {
      _user_id: adminUserId,
      _role: "admin",
    });

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    const { action, userId, banDuration, reason, entityType, entityId } = body;

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent self-action
    if (userId === adminUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "Cannot perform this action on yourself" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      // If deleting a specific entity type (agent/developer/agency), handle that first
      if (entityType === "agent" && entityId) {
        // Delete agent-specific data first
        await adminClient.from("agent_notifications").delete().eq("agent_id", entityId);
        await adminClient.from("agency_join_requests").delete().eq("agent_id", entityId);
        await adminClient.from("inquiries").delete().eq("agent_id", entityId);
        await adminClient.from("properties").delete().eq("agent_id", entityId);
        await adminClient.from("agents").delete().eq("id", entityId);
      } else if (entityType === "developer" && entityId) {
        // Delete developer-specific data first
        await adminClient.from("developer_notifications").delete().eq("developer_id", entityId);
        await adminClient.from("project_inquiries").delete().eq("developer_id", entityId);
        await adminClient.from("projects").delete().eq("developer_id", entityId);
        await adminClient.from("developers").delete().eq("id", entityId);
      } else if (entityType === "agency" && entityId) {
        // For agency deletion, we need to handle agents within it
        await adminClient.from("agency_notifications").delete().eq("agency_id", entityId);
        await adminClient.from("agency_announcements").delete().eq("agency_id", entityId);
        await adminClient.from("agency_invites").delete().eq("agency_id", entityId);
        await adminClient.from("agency_join_requests").delete().eq("agency_id", entityId);
        // Unlink agents from agency
        await adminClient.from("agents").update({ agency_id: null }).eq("agency_id", entityId);
        await adminClient.from("agencies").delete().eq("id", entityId);
        
        return new Response(
          JSON.stringify({ success: true, message: "Agency deleted successfully" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Full user deletion - cascade through all related tables
      // Order matters due to foreign key constraints
      await adminClient.from("price_drop_notifications").delete().eq("user_id", userId);
      await adminClient.from("favorites").delete().eq("user_id", userId);
      await adminClient.from("search_alerts").delete().eq("user_id", userId);
      await adminClient.from("inquiries").delete().eq("user_id", userId);
      await adminClient.from("property_views").delete().eq("viewer_user_id", userId);
      await adminClient.from("project_views").delete().eq("viewer_id", userId);
      await adminClient.from("buyer_profiles").delete().eq("user_id", userId);
      await adminClient.from("content_engagement").delete().eq("user_id", userId);
      await adminClient.from("experiment_exposures").delete().eq("user_id", userId);
      await adminClient.from("client_errors").delete().eq("user_id", userId);
      
      // Delete professional profiles if they exist
      await adminClient.from("agent_notifications").delete().in(
        "agent_id",
        (await adminClient.from("agents").select("id").eq("user_id", userId)).data?.map(a => a.id) || []
      );
      await adminClient.from("agents").delete().eq("user_id", userId);
      
      await adminClient.from("developer_notifications").delete().in(
        "developer_id",
        (await adminClient.from("developers").select("id").eq("user_id", userId)).data?.map(d => d.id) || []
      );
      await adminClient.from("developers").delete().eq("user_id", userId);
      
      // Delete user roles and profile
      await adminClient.from("user_roles").delete().eq("user_id", userId);
      await adminClient.from("profiles").delete().eq("id", userId);

      // Finally delete the auth user
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        console.error("Error deleting auth user:", deleteError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to delete user from auth" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log the action
      await adminClient.from("admin_audit_log").insert({
        user_id: adminUserId,
        action: "delete_user",
        entity_type: entityType || "user",
        entity_id: entityId || userId,
        old_value: { userId, entityType, entityId },
      });

      return new Response(
        JSON.stringify({ success: true, message: "User deleted successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "ban") {
      let bannedUntil: string | null = null;
      
      if (banDuration && banDuration !== "permanent") {
        const now = new Date();
        switch (banDuration) {
          case "1d":
            bannedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
            break;
          case "1w":
            bannedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case "1m":
            bannedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
            break;
        }
      }

      const { error: banError } = await adminClient
        .from("profiles")
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_until: bannedUntil,
          ban_reason: reason || null,
          banned_by: adminUserId,
        })
        .eq("id", userId);

      if (banError) {
        console.error("Error banning user:", banError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to ban user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log the action
      await adminClient.from("admin_audit_log").insert({
        user_id: adminUserId,
        action: "ban_user",
        entity_type: "user",
        entity_id: userId,
        new_value: { banDuration, reason, bannedUntil },
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: bannedUntil ? `User banned until ${bannedUntil}` : "User banned permanently" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "unban") {
      const { error: unbanError } = await adminClient
        .from("profiles")
        .update({
          is_banned: false,
          banned_at: null,
          banned_until: null,
          ban_reason: null,
          banned_by: null,
        })
        .eq("id", userId);

      if (unbanError) {
        console.error("Error unbanning user:", unbanError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to unban user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log the action
      await adminClient.from("admin_audit_log").insert({
        user_id: adminUserId,
        action: "unban_user",
        entity_type: "user",
        entity_id: userId,
      });

      return new Response(
        JSON.stringify({ success: true, message: "User unbanned successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-manage-account:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
