import type { DictKey } from "@/lib/i18n";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Sparkles, ListTodo, FolderKanban, CalendarDays, GraduationCap, StickyNote,
  CircleCheckBig, Apple, Dumbbell, Moon, Target, Lightbulb, BookOpen, Clapperboard, Music,
  Users, Plane, Gift, LineChart, Wallet, Gamepad2, Trophy, Database, Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: DictKey;
  icon: LucideIcon;
  /** Modules not yet built render the shared "coming soon" shell. */
  ready?: boolean;
}

export interface NavSection {
  labelKey: DictKey;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    labelKey: "nav.section.main",
    items: [
      { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard, ready: true },
      { href: "/assistant", labelKey: "nav.assistant", icon: Sparkles },
    ],
  },
  {
    labelKey: "nav.section.productivity",
    items: [
      { href: "/tasks", labelKey: "nav.tasks", icon: ListTodo, ready: true },
      { href: "/projects", labelKey: "nav.projects", icon: FolderKanban },
      { href: "/calendar", labelKey: "nav.calendar", icon: CalendarDays, ready: true },
      { href: "/study", labelKey: "nav.study", icon: GraduationCap },
      { href: "/notes", labelKey: "nav.notes", icon: StickyNote },
    ],
  },
  {
    labelKey: "nav.section.health",
    items: [
      { href: "/habits", labelKey: "nav.habits", icon: CircleCheckBig, ready: true },
      { href: "/nutrition", labelKey: "nav.nutrition", icon: Apple },
      { href: "/workouts", labelKey: "nav.workouts", icon: Dumbbell },
      { href: "/sleep", labelKey: "nav.sleep", icon: Moon },
    ],
  },
  {
    labelKey: "nav.section.personal",
    items: [
      { href: "/goals", labelKey: "nav.goals", icon: Target },
      { href: "/learning", labelKey: "nav.learning", icon: Lightbulb },
      { href: "/books", labelKey: "nav.books", icon: BookOpen },
      { href: "/movies", labelKey: "nav.movies", icon: Clapperboard },
      { href: "/music", labelKey: "nav.music", icon: Music },
      { href: "/contacts", labelKey: "nav.contacts", icon: Users },
      { href: "/travel", labelKey: "nav.travel", icon: Plane },
      { href: "/wishlist", labelKey: "nav.wishlist", icon: Gift },
    ],
  },
  {
    labelKey: "nav.section.finance",
    items: [
      { href: "/investments", labelKey: "nav.investments", icon: LineChart },
      { href: "/finance", labelKey: "nav.finance", icon: Wallet },
    ],
  },
  {
    labelKey: "nav.section.game",
    items: [
      { href: "/profile", labelKey: "nav.profile", icon: Gamepad2, ready: true },
      { href: "/achievements", labelKey: "nav.achievements", icon: Trophy, ready: true },
    ],
  },
  {
    labelKey: "nav.section.system",
    items: [
      { href: "/databases", labelKey: "nav.databases", icon: Database },
      { href: "/settings", labelKey: "nav.settings", icon: Settings, ready: true },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV.flatMap((s) => s.items);
