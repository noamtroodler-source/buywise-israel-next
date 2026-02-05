 import { createClient } from '@supabase/supabase-js';
 import type { Database } from './types';
 
 const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
 const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 
 /**
  * Create a Supabase client with the x-guest-id header set.
  * Used for guest operations on guest_property_saves table.
  */
 export function createGuestClient(guestId: string) {
   return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
     auth: {
       storage: localStorage,
       persistSession: false, // No auth session for guest client
       autoRefreshToken: false,
     },
     global: {
       headers: {
         'x-guest-id': guestId,
       },
     },
   });
 }