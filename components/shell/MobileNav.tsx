"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { LinkPending } from "./LinkPending";
import { NavList } from "./NavList";
import { BOTTOM_NAV, isActive, type NavArea } from "./nav";

export function MobileNav({ area, home, userSlot }: { area: NavArea; home: string; userSlot: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("a,button")?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>("a[href],button:not([disabled])"));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    const trigger = triggerRef.current;
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-raised/90 px-4 backdrop-blur nav:hidden">
        <Link href={home} prefetch={false} aria-label={area === "admin" ? "Painel interno" : "Portal do cliente"}>
          <Logo compact />
        </Link>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="menu-mobile"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-ocean hover:bg-ocean-50"
        >
          <Menu className="h-6 w-6" aria-hidden />
          <span className="sr-only">Abrir menu</span>
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 nav:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-fade-in bg-ocean-deep/40" onClick={close} aria-hidden />
          <div
            id="menu-mobile"
            ref={panelRef}
            className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] animate-slide-in flex-col shadow-pop"
            style={{ backgroundColor: "#071e36" }}
          >
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4" style={{ backgroundColor: "#071e36" }}>
              <Logo tone="light" subtitulo={area === "admin" ? "Painel interno" : "Portal do cliente"} />
              <button
                type="button"
                onClick={close}
                className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" aria-hidden />
                <span className="sr-only">Fechar menu</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-5">
              <NavList area={area} onNavigate={close} dark />
            </div>
            <div className="border-t border-white/10 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">{userSlot}</div>
          </div>
        </div>
      )}

      {area === "cliente" && (
        <nav
          aria-label="Atalhos"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-raised/95 pb-[env(safe-area-inset-bottom)] backdrop-blur nav:hidden"
        >
          <ul className="mx-auto grid max-w-md grid-cols-5">
            {BOTTOM_NAV.map((l) => {
              const active = isActive(pathname, l.href);
              const Icon = l.icon;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-16 flex-col items-center justify-center gap-1 text-[.68rem] font-medium",
                      active ? "text-ocean" : "text-ink-soft"
                    )}
                  >
                    <span className={cn("flex h-7 w-12 items-center justify-center rounded-full", active && "bg-ocean-50")}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="flex items-center gap-1">
                      {l.label}
                      <LinkPending />
                    </span>
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[.68rem] font-medium text-ink-soft"
              >
                <span className="flex h-7 w-12 items-center justify-center rounded-full">
                  <Menu className="h-5 w-5" aria-hidden />
                </span>
                Mais
              </button>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}
