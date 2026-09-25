"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LinkPending } from "./LinkPending";
import { isActive, navPorArea, type NavArea } from "./nav";

export function NavList({
  area,
  onNavigate,
  expanded = true,
  dark = false,
}: {
  area: NavArea;
  onNavigate?: () => void;
  expanded?: boolean;
  dark?: boolean;
}) {
  const pathname = usePathname();
  const groups = navPorArea(area);

  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.title}>
          <p
            className={cn(
              "mb-1 px-3 font-mono text-[.64rem] font-medium uppercase tracking-[.14em]",
              dark ? "text-menu-muted" : "text-ink-soft",
              !expanded && "sr-only"
            )}
          >
            {group.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.links.map((l) => {
              const active = isActive(pathname, l.href);
              const Icon = l.icon;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    prefetch={false}
                    onClick={onNavigate}
                    title={expanded ? undefined : l.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                      !expanded && "justify-center px-0",
                      dark
                        ? active
                          ? "bg-menu-accent text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                        : active
                          ? "bg-ocean-50 text-ocean"
                          : "text-ink-soft hover:bg-ocean-50 hover:text-ocean"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    <span className={cn("truncate", !expanded && "sr-only")}>{l.label}</span>
                    {expanded && <LinkPending />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
