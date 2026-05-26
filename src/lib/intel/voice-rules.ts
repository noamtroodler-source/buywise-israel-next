// BuyWise Intel voice rules — shared between the AI prompts (edge functions
// import this same list via supabase/functions/_shared/voice-rules.ts) and the
// admin-side voice linter. Keep this file additions-only; never delete a rule.

export const BANNED_OPENERS = [
  'this means',
  'in short',
  'in a nutshell',
  'buckle up',
  "let's dive in",
  "let's unpack",
  'all in all',
  'at the end of the day',
  'in conclusion',
  'to sum up',
  'simply put',
  'in essence',
];

export const BANNED_PHRASES = [
  "it's important to note",
  'navigate the landscape',
  'in today’s market',
  "in today's market",
  'in the current climate',
  'tectonic shift',
  'paradigm shift',
  'game changer',
  'game-changer',
  'tap into',
  'unlock the potential',
  'a wide range of',
  'world-class',
  'cutting-edge',
  'state-of-the-art',
  'leverage',
  'streamline',
  'robust',
  'seamless',
  'delve into',
  'a testament to',
];

export const BANNED_TERMS = [
  // Brand voice — already in core memory
  'anglos',
  'anglo buyers',
];

export interface VoiceIssue {
  type: 'opener' | 'phrase' | 'term' | 'em_dash_overload';
  match: string;
  index: number;
}

export function lintVoice(text: string): VoiceIssue[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const issues: VoiceIssue[] = [];

  for (const opener of BANNED_OPENERS) {
    if (lower.trimStart().startsWith(opener)) {
      issues.push({ type: 'opener', match: opener, index: 0 });
    }
  }
  for (const phrase of BANNED_PHRASES) {
    const idx = lower.indexOf(phrase);
    if (idx >= 0) issues.push({ type: 'phrase', match: phrase, index: idx });
  }
  for (const term of BANNED_TERMS) {
    const idx = lower.indexOf(term);
    if (idx >= 0) issues.push({ type: 'term', match: term, index: idx });
  }
  const emDashCount = (text.match(/\u2014/g) ?? []).length;
  if (emDashCount > 2) {
    issues.push({ type: 'em_dash_overload', match: `${emDashCount} em dashes`, index: 0 });
  }
  return issues;
}

export const VOICE_GUIDANCE = `BuyWise voice — trusted friend, not consultant, not journalist trying to win awards.

DO:
- Concrete numbers. "₪7,200/mo" beats "monthly mortgage costs".
- Plain verbs. "BoI cut the rate" beats "implemented a downward adjustment".
- One observation per beat. Stop when you've made the point.
- Use ₪ for shekels. Say "international buyers" — never "Anglos".

DO NOT:
- Open with: ${BANNED_OPENERS.slice(0, 6).join(', ')}…
- Use cliches: ${BANNED_PHRASES.slice(0, 6).join(', ')}…
- Stack em dashes (max two per paragraph).
- Tell the reader what to do. State what's happening, what we're watching, what's still unclear.
- Invent numbers or quote sources we don't have. If the article doesn't say it, neither do we.
- Repeat the headline.`;
