import {
  Activity, BarChart3, Bell, Boxes, Briefcase, Building2, Calendar, ChartLine, Check, ClipboardList, Cloud, Code2, Cpu, CreditCard,
  Database, FileText, Gauge, Globe, GraduationCap, Hotel, Layers, LayoutDashboard, Lock, Mail, MessageSquare, Monitor, Package,
  Palette, Phone, PlugZap, Receipt, Rocket, Search, Server, Settings, ShieldCheck, ShoppingBag, ShoppingCart, Smartphone, Sparkles,
  Store, Truck, Users, UtensilsCrossed, Wallet, Workflow, Wrench, Zap, type LucideIcon,
} from 'lucide-react';

/**
 * Bo icon dung trong CMS (nhap ten lucide, vd "shopping-cart" hoac "ShoppingCart").
 * Chi import cac icon duoc phep → bundle nho; ten la → icon mac dinh.
 */
const icons: Record<string, LucideIcon> = {
  activity: Activity, 'bar-chart': BarChart3, 'bar-chart-3': BarChart3, bell: Bell, boxes: Boxes, briefcase: Briefcase,
  building: Building2, 'building-2': Building2, calendar: Calendar, 'chart-line': ChartLine, check: Check,
  'clipboard-list': ClipboardList, cloud: Cloud, code: Code2, 'code-2': Code2, cpu: Cpu, 'credit-card': CreditCard,
  database: Database, 'file-text': FileText, gauge: Gauge, globe: Globe, 'graduation-cap': GraduationCap, hotel: Hotel,
  layers: Layers, 'layout-dashboard': LayoutDashboard, lock: Lock, mail: Mail, 'message-square': MessageSquare, monitor: Monitor,
  package: Package, palette: Palette, phone: Phone, 'plug-zap': PlugZap, receipt: Receipt, rocket: Rocket, search: Search,
  server: Server, settings: Settings, 'shield-check': ShieldCheck, 'shopping-bag': ShoppingBag, 'shopping-cart': ShoppingCart,
  smartphone: Smartphone, sparkles: Sparkles, store: Store, truck: Truck, users: Users, utensils: UtensilsCrossed,
  'utensils-crossed': UtensilsCrossed, wallet: Wallet, workflow: Workflow, wrench: Wrench, zap: Zap,
};

function normalize(name: string) {
  return name.trim().replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[\s_]+/g, '-').toLowerCase();
}

export function Icon({ name, className, fallback = Layers }: { name: string | null | undefined; className?: string; fallback?: LucideIcon | null }) {
  const Component = (name && icons[normalize(name)]) || fallback;
  return Component ? <Component className={className} aria-hidden strokeWidth={1.75} /> : null;
}
