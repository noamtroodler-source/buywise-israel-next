// Backfill: enrich existing intel_articles that need translation or re-categorization.
// Targets:
//   - Hebrew articles missing translated_at
//   - English articles still in "general" with auto_categorized = true
// Processes up to ?limit=N (default 30) per invocation. Idempotent. Admin-only.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { enrichArticle } from "../_shared/intel-ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Auth: require admin (callers come via supabase.functions.invoke from admin UI)
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await anonClient.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "admin required" }), { status: 403, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 30)));

  // Priority 1: untranslated Hebrew
  const { data: heRows } = await supabase
    .from("intel_articles")
    .select("id, headline, excerpt, source_language")
    .eq("source_language", "he")
    .is("translated_at", null)
    .order("published_at", { ascending: false })
    .limit(limit);

  // Priority 2: English "general" articles never AI-categorized
  const remaining = limit - (heRows?.length ?? 0);
  let enRows: any[] = [];
  if (remaining > 0) {
    const { data } = await supabase
      .from("intel_articles")
      .select("id, headline, excerpt, source_language")
      .eq("source_language", "en")
      .eq("category", "general")
      .eq("auto_categorized", true)
      .is("category_confidence", null)
      .order("published_at", { ascending: false })
      .limit(remaining);
    enRows = data ?? [];
  }

  const rows = [...(heRows ?? []), ...enRows];

  let processed = 0;
  let failed = 0;
  let translated = 0;
  let recategorized = 0;

  for (const r of rows) {
    const enriched = await enrichArticle({
      headline: r.headline,
      excerpt: r.excerpt,
      language: r.source_language as "en" | "he",
    });
    if (!enriched) { failed++; continue; }

    const patch: Record<string, unknown> = {
      headline_en: enriched.headline_en,
      excerpt_en: enriched.excerpt_en,
      translated_at: new Date().toISOString(),
      category_confidence: enriched.category_confidence,
    };
    // Only overwrite category if still auto-categorized (don't clobber admin choices)
    patch.category = enriched.category;
    patch.relevance_score = enriched.relevance_score;
    // Auto-hide off-topic articles (war, sports, unrelated tech, foreign markets, etc.)
    if (enriched.relevance_score <= 1) patch.is_hidden = true;

    const { error: upErr } = await supabase
      .from("intel_articles")
      .update(patch)
      .eq("id", r.id)
      .eq("auto_categorized", true); // safety: never clobber manual category

    if (upErr) { failed++; continue; }

    processed++;
    if (r.source_language === "he") translated++;
    else recategorized++;

    // gentle rate-limit
    await new Promise((ok) => setTimeout(ok, 400));
  }

  return new Response(
    JSON.stringify({
      ok: true,
      candidates: rows.length,
      processed,
      failed,
      translated,
      recategorized,
      note: rows.length === limit ? "More rows remain — call again." : "Backlog drained.",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
