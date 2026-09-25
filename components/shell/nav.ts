import {
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  FileSignature,
  FileText,
  Home,
  Landmark,
  Package,
  Receipt,
  ScanText,
  ScrollText,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavArea = "cliente" | "admin";
export type NavLink = { href: string; label: string; icon: LucideIcon };
export type NavGroup = { title: string; links: NavLink[] };

export const NAV_CLIENTE: NavGroup[] = [
  { title: "Visão geral", links: [{ href: "/", label: "Início", icon: Home }] },
  {
    title: "Carteira",
    links: [
      { href: "/perfil", label: "Perfil", icon: UserRound },
      { href: "/imoveis", label: "Imóveis", icon: Building2 },
    ],
  },
  {
    title: "Operação & financeiro",
    links: [
      { href: "/financeiro", label: "Financeiro", icon: Wallet },
      { href: "/operacao", label: "Operação", icon: CalendarDays },
      { href: "/estoque", label: "Estoque", icon: Package },
      { href: "/checklist", label: "Checklist de prontidão", icon: ClipboardCheck },
      { href: "/fechamento", label: "Fechamento mensal", icon: CalendarCheck },
      { href: "/rentabilidade", label: "Rentabilidade", icon: TrendingUp },
    ],
  },
  {
    title: "Documentos",
    links: [
      { href: "/notas", label: "Notas fiscais", icon: FileText },
      { href: "/contratos", label: "Contratos", icon: FileSignature },
      { href: "/extrato", label: "Extrato", icon: ScanText },
    ],
  },
  { title: "Fiscal", links: [{ href: "/impostos", label: "Impostos", icon: Landmark }] },
];

export const NAV_ADMIN: NavGroup[] = [
  { title: "Visão geral", links: [{ href: "/admin", label: "Dashboard", icon: Home }] },
  {
    title: "Carteira",
    links: [
      { href: "/admin/clientes", label: "Clientes", icon: Users },
      { href: "/admin/fiscal", label: "Fiscal", icon: Landmark },
    ],
  },
  {
    title: "Operação & financeiro",
    links: [
      { href: "/admin/financeiro", label: "Financeiro", icon: Wallet },
      { href: "/admin/fechamento", label: "Fechamento mensal", icon: CalendarCheck },
    ],
  },
  {
    title: "Documentos",
    links: [
      { href: "/admin/notas", label: "Notas fiscais", icon: Receipt },
      { href: "/admin/contratos", label: "Contratos", icon: FileSignature },
      { href: "/admin/extrato", label: "Extrato", icon: ScanText },
    ],
  },
  { title: "Sistema", links: [{ href: "/admin/auditoria", label: "Auditoria", icon: ScrollText }] },
];

export const BOTTOM_NAV: NavLink[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/imoveis", label: "Imóveis", icon: Building2 },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/impostos", label: "Impostos", icon: Landmark },
];

export function navPorArea(area: NavArea): NavGroup[] {
  return area === "admin" ? NAV_ADMIN : NAV_CLIENTE;
}

export function isActive(pathname: string, href: string) {
  if (href === "/" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}
