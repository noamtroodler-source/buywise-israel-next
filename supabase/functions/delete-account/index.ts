import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token for validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate JWT and get user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error('JWT validation failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    console.log(`Account deletion requested for user: ${userId} (${userEmail})`);

    // Create admin client for deletion operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user has professional roles (agent, developer, agency)
    const { data: roles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const professionalRoles = roles?.filter(r => 
      ['agent', 'developer', 'agency_admin'].includes(r.role)
    );

    if (professionalRoles && professionalRoles.length > 0) {
      // Check for active listings
      const { data: agentData } = await adminClient
        .from('agents')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (agentData) {
        const { count: activeListings } = await adminClient
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('agent_id', agentData.id)
          .eq('is_published', true);

        if (activeListings && activeListings > 0) {
          return new Response(
            JSON.stringify({ 
              error: 'Professional account with active listings',
              message: 'Please unpublish or transfer your listings before deleting your account, or contact support for assistance.'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Delete user data in order (respecting foreign key constraints)
    const deletionSteps = [
      { table: 'price_drop_notifications', column: 'user_id' },
      { table: 'favorites', column: 'user_id' },
      { table: 'search_alerts', column: 'user_id' },
      { table: 'inquiries', column: 'user_id' },
      { table: 'property_views', column: 'user_id' },
      { table: 'project_views', column: 'user_id' },
      { table: 'buyer_profiles', column: 'user_id' },
      { table: 'user_roles', column: 'user_id' },
      { table: 'profiles', column: 'id' },
    ];

    for (const step of deletionSteps) {
      const { error } = await adminClient
        .from(step.table)
        .delete()
        .eq(step.column, userId);

      if (error) {
        console.error(`Error deleting from ${step.table}:`, error);
        // Continue with other deletions, some tables might not have data
      } else {
        console.log(`Deleted user data from ${step.table}`);
      }
    }

    // Delete the auth user (this is the final step)
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to complete account deletion',
          message: 'Your data has been removed, but there was an issue with the final step. Please contact support.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Account successfully deleted for user: ${userId} (${userEmail})`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Your account has been permanently deleted.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error during account deletion:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again or contact support.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
