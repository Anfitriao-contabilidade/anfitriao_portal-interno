export function Logo({
  compact = false,
  tone = "ocean",
  subtitulo = "Portal do Cliente",
}: {
  compact?: boolean;
  tone?: "ocean" | "dark" | "light";
  subtitulo?: string;
}) {
  const claro = tone === "light";
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={cnMark(claro)}
      >
        A
      </span>
      {!compact && (
        <span className="flex min-w-0 flex-col leading-none">
          <span className={claro ? "font-display text-[1.05rem] font-semibold text-white" : "font-display text-[1.05rem] font-semibold text-ink"}>
            Anfitrião
          </span>
          <span className={claro ? "mt-1 font-mono text-[.62rem] uppercase tracking-[.16em] text-white/70" : "mt-1 font-mono text-[.62rem] uppercase tracking-[.16em] text-ink-soft"}>
            {subtitulo}
          </span>
        </span>
      )}
    </span>
  );
}

function cnMark(claro: boolean) {
  return claro
    ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 font-display text-lg font-semibold text-white"
    : "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ocean font-display text-lg font-semibold text-white";
}
