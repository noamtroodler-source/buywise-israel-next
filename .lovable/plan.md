
Goal
- Bring back a clear “Paid in Full” state everywhere (especially in Edit mode), while keeping the exact same underlying logic (include_mortgage boolean) and behavior.
- Make the on/off control “make sense” by clearly indicating the current state and what toggling will do.

What’s happening now (based on current code)
- View mode (not editing) DOES show “Paid in Full” (lines ~140–159) and a “Switch to Mortgage” button. So the option still exists.
- Edit mode (when you click “Edit Preferences”) shows a Switch with a fixed label “Take a Mortgage” (lines ~70–88). When the switch is OFF, it implies “Paid in Full” but never explicitly says “Paid in Full”. That’s why it feels like the option disappeared.

Design decision (minimal change, no reinvention)
- Keep the same control type (Switch) and the same data model (include_mortgage).
- Only change the copy + icon in the Edit mode header so it explicitly shows:
  - Current state: “Paid in Full” when OFF, “Taking a Mortgage” when ON
  - Action hint: “Toggle on to take a mortgage” vs “Toggle off to pay in full”
- Keep the rest (mortgage fields only when ON, Save/Cancel, etc.) exactly as-is.

Implementation steps (single file)
1) Update Edit Mode “Financing Method Toggle” block in:
   - src/components/profile/sections/MortgageSection.tsx
   - The block currently at lines ~70–88

2) Replace the fixed “Take a Mortgage” label with a dynamic state-based header:
   - When formData.includeMortgage === false:
     - Icon: Banknote
     - Title: “Paid in Full”
     - Subtitle: “Cash purchase — mortgage costs are excluded. Toggle on to take a mortgage.”
   - When formData.includeMortgage === true:
     - Icon: CreditCard
     - Title: “Taking a Mortgage”
     - Subtitle: “Mortgage costs included. Toggle off to pay in full.”

3) Keep the Switch behavior identical:
   - checked={formData.includeMortgage}
   - onCheckedChange sets formData.includeMortgage
   - No change to save logic, normalization logic, or preference storage.

4) Leave View Mode as-is (already correct now):
   - Paid in Full card with “Switch to Mortgage”
   - Mortgage detail grid with “Switch to Paid in Full”
   This keeps the “simple Paid in Full vs. detailed Mortgage” mental model you described.

Edge cases / behavior to verify after change
- If user is Paid in Full and clicks “Edit Preferences”:
  - They should see “Paid in Full” explicitly in the header (not “Take a Mortgage”).
  - Mortgage fields should remain hidden until toggled on.
- If user is Mortgage and clicks “Edit Preferences”:
  - They should see “Taking a Mortgage” explicitly and the mortgage fields visible.
- Toggling on/off in Edit mode should only affect UI until pressing Save (current behavior).
- Toggling via the View mode buttons should still immediately persist (current behavior).

Why this meets your request
- Paid in Full never “goes away” visually anymore: it’s clearly shown in both View mode and Edit mode.
- The UI becomes “cleaner between the two” states with no logic changes and no new components—just clearer labeling in the existing Switch row.

Files to change
- src/components/profile/sections/MortgageSection.tsx
  - Edit-mode toggle header copy + icon only.
