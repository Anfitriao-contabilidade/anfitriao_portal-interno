"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LinkPending } from "./LinkPending";
import { isActive, navPorArea, type NavArea } from "./nav";

export function NavList({ area, onNavigate }: { area: NavArea; onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = navPorArea(area);

  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-1 px-3 font-mono text-[.64rem] font-medium uppercase tracking-[.14em] text-ink-soft">
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
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                      active ? "bg-ocean-50 text-ocean" : "text-ink-soft hover:bg-ocean-50 hover:text-ocean"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    <span className="truncate">{l.label}</span>
                    <LinkPending />
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
