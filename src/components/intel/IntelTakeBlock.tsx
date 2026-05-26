interface Props {
  label: string;
  body: string;
}

export function IntelTakeBlock({ label, body }: Props) {
  return (
    <div className="mt-4 rounded-md border-l-2 border-primary bg-primary/5 p-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
          {label}
        </span>
        <span className="text-xs text-muted-foreground">by BuyWise Editorial</span>
      </div>
      <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{body}</p>
    </div>
  );
}
