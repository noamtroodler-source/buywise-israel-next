interface Props {
  label: string;
  body: string;
  byline?: string;
}

export function IntelTakeBlock({ label, body, byline = 'By the BuyWise desk' }: Props) {
  return (
    <div className="mt-5 border-l-2 border-primary bg-primary/[0.04] pl-5 pr-4 py-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex items-center rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
          {label}
        </span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{byline}</span>
      </div>
      <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-line">{body}</p>
    </div>
  );
}
