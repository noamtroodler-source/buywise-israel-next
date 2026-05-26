// Deno-side mirror of src/lib/intel/voice-rules.ts.
// Edge functions cannot import from /src, so this is kept in sync by hand.
// If you edit this file, edit src/lib/intel/voice-rules.ts to match.

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
  "in today's market",
  'in the current climate',
  'tectonic shift',
  'paradigm shift',
  'game changer',
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

export const VOICE_GUIDANCE = `BuyWise voice — trusted friend, not a consultant, not a journalist chasing awards.

DO:
- Use concrete numbers from the source. "₪7,200/mo" beats "monthly mortgage costs".
- Plain verbs. "BoI cut the rate" beats "implemented a downward adjustment".
- One observation per beat. Stop when the point is made.
- Use ₪ for shekels. Say "international buyers" — never "Anglos".

DO NOT:
- Open any beat with: ${BANNED_OPENERS.join(', ')}.
- Use these cliches: ${BANNED_PHRASES.join(', ')}.
- Stack em dashes. Maximum two per beat.
- Tell the reader what to do ("you should…"). State what's happening and what we're watching.
- Invent numbers, sources, or quotes. If the article doesn't say it, neither do we.
- Repeat the headline.
- Hedge with "could potentially" / "may possibly". Say it or don't.`;
