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
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavLink = { href: string; label: string; icon: LucideIcon };
export type NavGroup = { title: string; links: NavLink[] };

// Grupos e ordem espelham o menu do Painel Interno da equipe (pedido do usuário).
export const NAV_GROUPS: NavGroup[] = [
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
      { href: "/extrato", label: "Extrato (IA)", icon: ScanText },
    ],
  },
  { title: "Fiscal", links: [{ href: "/impostos", label: "Impostos", icon: Landmark }] },
];

export const ADMIN_GROUP: NavGroup = {
  title: "Equipe",
  links: [
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/admin/notas", label: "Emitir notas", icon: Receipt },
  ],
};

/** Atalhos da barra inferior no celular (o resto fica no menu). */
export const BOTTOM_NAV: NavLink[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/imoveis", label: "Imóveis", icon: Building2 },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/impostos", label: "Impostos", icon: Landmark },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
