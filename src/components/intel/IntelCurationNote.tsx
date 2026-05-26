export function IntelCurationNote() {
  return (
    <div className="border-t border-border pt-5">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
        How we choose stories
      </h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        <li className="flex gap-2">
          <span className="text-primary">·</span>
          <span>Relevant to international buyers making a real decision.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-primary">·</span>
          <span>Sourced from established Israeli outlets — never rewritten, always linked.</span>
        </li>
        <li className="flex gap-2">
          <span className="text-primary">·</span>
          <span>Stories that change a number, a date, or a rule get a BuyWise Take.</span>
        </li>
      </ul>
    </div>
  );
}
