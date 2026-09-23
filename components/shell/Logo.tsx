export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ocean font-display text-lg font-semibold text-white"
      >
        A
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.05rem] font-semibold text-ocean">Anfitrião</span>
        {!compact && (
          <span className="mt-1 font-mono text-[.62rem] uppercase tracking-[.16em] text-ink-soft">Portal do Cliente</span>
        )}
      </span>
    </span>
  );
}
