// Backfill: enrich existing intel_articles AND draft breakdowns for any visible
// article that doesn't have one yet. Admin-only.
//   - Hebrew articles missing translated_at → enrich
//   - English "general" articles never AI-categorized → enrich
//   - Any visible (is_hidden=false, relevance >=2) article without a published
//     breakdown → draft + auto-publish breakdown
// Processes up to ?limit=N (default 20) per invocation. Idempotent.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { enrichArticle, draftBreakdown } from "../_shared/intel-ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

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
  let bodyLimit: number | null = null;
  let bodyMode: string | null = null;
  try {
    if (req.method === "POST") {
      const b = await req.clone().json().catch(() => ({}));
      if (b && typeof b === "object") {
        if (b.limit != null) bodyLimit = Number(b.limit);
        if (typeof b.mode === "string") bodyMode = b.mode;
      }
    }
  } catch { /* ignore */ }
  const limit = Math.max(1, Math.min(50, Number(bodyLimit ?? url.searchParams.get("limit") ?? 20)));
  const mode = bodyMode ?? url.searchParams.get("mode") ?? "all"; // "enrich" | "breakdowns" | "all"

  let processed = 0, failed = 0, translated = 0, recategorized = 0, breakdownsAdded = 0;

  // ---- Enrichment pass ----
  if (mode === "all" || mode === "enrich") {
    const { data: heRows } = await supabase
      .from("intel_articles")
      .select("id, headline, excerpt, source_language")
      .eq("source_language", "he")
      .is("translated_at", null)
      .order("published_at", { ascending: false })
      .limit(limit);

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

    for (const r of [...(heRows ?? []), ...enRows]) {
      const enriched = await enrichArticle({
        headline: r.headline, excerpt: r.excerpt, language: r.source_language as "en" | "he",
      });
      if (!enriched) { failed++; continue; }
      const patch: Record<string, unknown> = {
        headline_en: enriched.headline_en,
        excerpt_en: enriched.excerpt_en,
        translated_at: new Date().toISOString(),
        category_confidence: enriched.category_confidence,
        category: enriched.category,
        relevance_score: enriched.relevance_score,
      };
      if (enriched.relevance_score <= 1) patch.is_hidden = true;
      const { error: upErr } = await supabase
        .from("intel_articles").update(patch).eq("id", r.id).eq("auto_categorized", true);
      if (upErr) { failed++; continue; }
      processed++;
      if (r.source_language === "he") translated++; else recategorized++;
      await new Promise((ok) => setTimeout(ok, 400));
    }
  }

  // ---- Breakdown pass ----
  if (mode === "all" || mode === "breakdowns") {
    // Find visible articles without a published breakdown
    const { data: candidates } = await supabase
      .from("intel_articles")
      .select("id, headline, headline_en, excerpt, excerpt_en, category, source_name")
      .eq("is_hidden", false)
      .gte("relevance_score", 2)
      .order("published_at", { ascending: false })
      .limit(80);

    if (candidates && candidates.length) {
      const ids = candidates.map((c: any) => c.id);
      const { data: existing } = await supabase
        .from("intel_takes")
        .select("article_id")
        .eq("tier", "breakdown")
        .eq("status", "published")
        .in("article_id", ids);
      const existingSet = new Set((existing ?? []).map((e: any) => e.article_id));
      const todo = candidates.filter((c: any) => !existingSet.has(c.id)).slice(0, limit);

      for (const a of todo) {
        const b = await draftBreakdown({
          headline: a.headline_en || a.headline,
          excerpt: a.excerpt_en || a.excerpt,
          category: a.category ?? "general",
          source_name: a.source_name ?? "unknown",
        });
        if (!b) { failed++; continue; }
        const { error: upErr } = await supabase
          .from("intel_takes")
          .upsert({
            article_id: a.id,
            tier: "breakdown",
            status: "published",
            take_label: b.take_label,
            signal: b.signal,
            why_you_care: b.why_you_care,
            our_move: b.our_move,
            take_body: [b.signal, b.why_you_care, b.our_move].filter(Boolean).join("\n\n"),
            ai_drafted: true,
            published_at: new Date().toISOString(),
          }, { onConflict: "article_id,tier" });
        if (upErr) { console.error("[backlog] upsert take", upErr.message); failed++; continue; }
        breakdownsAdded++;
        await new Promise((ok) => setTimeout(ok, 400));
      }
    }
  }

  return new Response(
    JSON.stringify({
      ok: true, mode, processed, failed, translated, recategorized, breakdownsAdded,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
