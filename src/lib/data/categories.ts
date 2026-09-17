import { db } from "@/lib/db/dexie";
import { upsert, softDelete, makeRecord, activeRecords } from "@/lib/data/repository";
import { deterministicId } from "@/lib/id";
import { translate, type DictKey } from "@/lib/i18n";
import type { Category, Locale } from "@/lib/types";

const catOpts = (userId: string) => ({ table: db().categories, syncTable: "categories" as const, userId });

/** Deterministic id for a seeded default category (merges across devices). */
export function categorySeedId(userId: string, slug: string): string {
  return deterministicId(`${userId}:cat:${slug}`);
}

/** The default category set (seeded once per user; fully editable afterwards). */
export const DEFAULT_CATEGORIES: { slug: string; color: string; icon: string; labelKey: DictKey }[] = [
  { slug: "amigos", color: "oklch(0.65 0.17 255)", icon: "Users", labelKey: "events.cat.amigos" },
  { slug: "familia", color: "oklch(0.68 0.16 150)", icon: "Home", labelKey: "events.cat.familia" },
  { slug: "deporte", color: "oklch(0.66 0.19 35)", icon: "Dumbbell", labelKey: "events.cat.deporte" },
  { slug: "uni", color: "oklch(0.62 0.19 300)", icon: "GraduationCap", labelKey: "events.cat.uni" },
  { slug: "cumples", color: "oklch(0.70 0.19 350)", icon: "Cake", labelKey: "events.cat.cumples" },
  { slug: "cortesito", color: "oklch(0.72 0.13 195)", icon: "Scissors", labelKey: "events.cat.cortesito" },
  { slug: "clases", color: "oklch(0.77 0.15 85)", icon: "BookOpen", labelKey: "events.cat.clases" },
  { slug: "pagos", color: "oklch(0.70 0.16 130)", icon: "CreditCard", labelKey: "events.cat.pagos" },
  { slug: "medico", color: "oklch(0.68 0.14 220)", icon: "Stethoscope", labelKey: "events.cat.medico" },
  { slug: "personal", color: "oklch(0.62 0.18 285)", icon: "User", labelKey: "events.cat.personal" },
  { slug: "otros", color: "oklch(0.62 0.03 260)", icon: "CalendarClock", labelKey: "events.cat.otros" },
];

/** Palette offered in the category editor (spread around the hue wheel). */
export const CATEGORY_COLORS = [
  // reds / oranges / ambers
  "oklch(0.62 0.21 25)", "oklch(0.66 0.20 40)", "oklch(0.72 0.18 55)", "oklch(0.77 0.15 85)",
  // yellow-greens / greens
  "oklch(0.80 0.16 105)", "oklch(0.72 0.18 130)", "oklch(0.68 0.16 150)", "oklch(0.70 0.14 168)",
  // teals / cyans
  "oklch(0.72 0.13 190)", "oklch(0.70 0.13 205)", "oklch(0.68 0.14 220)",
  // blues / indigos
  "oklch(0.64 0.17 240)", "oklch(0.62 0.19 262)", "oklch(0.58 0.18 278)",
  // violets / magentas / pinks
  "oklch(0.62 0.20 300)", "oklch(0.66 0.21 325)", "oklch(0.70 0.19 350)", "oklch(0.72 0.16 5)",
  // browns / neutrals
  "oklch(0.55 0.08 60)", "oklch(0.72 0.03 260)", "oklch(0.62 0.03 260)", "oklch(0.48 0.02 260)",
];

/** The fallback category id (legacy/uncategorized items resolve here). */
export function defaultCategoryId(userId: string): string {
  return categorySeedId(userId, "otros");
}

/** Resolve an item's effective category id, healing legacy records. */
export function resolveCategoryId(userId: string, categoryId?: string, legacySlug?: string): string {
  if (categoryId) return categoryId;
  if (legacySlug) return categorySeedId(userId, legacySlug);
  return defaultCategoryId(userId);
}

/* ------------------------------------------------------------- Queries ---- */

export async function listCategories(userId: string): Promise<Category[]> {
  return activeRecords(await db().categories.where("user_id").equals(userId).toArray()).sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name),
  );
}

export async function categoryMap(userId: string): Promise<Map<string, Category>> {
  return new Map((await listCategories(userId)).map((c) => [c.id, c]));
}

/* ------------------------------------------------------------- Seeding ---- */

/** Seed the default categories once (deterministic ids → idempotent, merges). */
export async function seedDefaultCategories(userId: string, locale: Locale): Promise<void> {
  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const d = DEFAULT_CATEGORIES[i];
    const cat = makeRecord<Category>(userId, {
      id: categorySeedId(userId, d.slug),
      name: translate(locale, d.labelKey),
      color: d.color,
      icon: d.icon,
      order: i,
    });
    await upsert(catOpts(userId), cat);
  }
}

/* ----------------------------------------------------------- Mutations ---- */

export interface CategoryInput {
  name: string;
  color: string;
  icon: string;
}

export async function createCategory(userId: string, input: CategoryInput): Promise<Category> {
  const existing = await listCategories(userId);
  const order = existing.reduce((max, c) => Math.max(max, c.order), -1) + 1;
  const cat = makeRecord<Category>(userId, {
    name: input.name.trim() || "—",
    color: input.color,
    icon: input.icon,
    order,
  });
  return upsert(catOpts(userId), cat);
}

export async function updateCategory(userId: string, category: Category): Promise<Category> {
  return upsert(catOpts(userId), category);
}

export async function deleteCategory(userId: string, id: string): Promise<void> {
  await softDelete(catOpts(userId), id);
}
