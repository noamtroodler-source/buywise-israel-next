import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Missing public backend env vars');
const supabase = createClient(url, key);

const accounts = [
  { email: 'claude.test.user@buywise.local', password: 'BuyWiseTest!2026User', name: 'Claude Test User' },
  { email: 'claude.test.agency@buywise.local', password: 'BuyWiseTest!2026Agency', name: 'Claude Test Agency Admin' },
];

for (const acct of accounts) {
  const { data, error } = await supabase.auth.signUp({
    email: acct.email,
    password: acct.password,
    options: { data: { full_name: acct.name } }
  });
  console.log(JSON.stringify({ email: acct.email, createdUserId: data?.user?.id ?? null, error: error?.message ?? null, confirmedAt: data?.user?.email_confirmed_at ?? null }));
}

for (const acct of accounts) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: acct.email, password: acct.password });
  console.log(JSON.stringify({ email: acct.email, signInOk: !!data.session, userId: data.user?.id ?? null, error: error?.message ?? null }));
  if (data.session) await supabase.auth.signOut();
}
