"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LinkPending } from "./LinkPending";
import { ADMIN_GROUP, NAV_GROUPS, isActive, type NavGroup } from "./nav";

export function NavList({ isAdmin, onNavigate }: { isAdmin: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups: NavGroup[] = isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;

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
              const team = group === ADMIN_GROUP;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    prefetch={false}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                      active
                        ? team
                          ? "bg-gold-50 text-gold-dark"
                          : "bg-ocean text-white shadow-sm"
                        : team
                          ? "text-gold-dark hover:bg-gold-50"
                          : "text-ink-soft hover:bg-ocean-50 hover:text-ocean"
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "" : "opacity-80")} aria-hidden />
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
