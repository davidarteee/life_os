// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { resetLocalDatabase } from "@/lib/db/dexie";
import {
  seedDefaultCategories, listCategories, createCategory, deleteCategory,
  categorySeedId, defaultCategoryId, resolveCategoryId, DEFAULT_CATEGORIES,
} from "@/lib/data/categories";

const UID = "abababab-abab-abab-abab-abababababab";
const OTHER = "cdcdcdcd-cdcd-cdcd-cdcd-cdcdcdcdcdcd";

beforeEach(async () => {
  await resetLocalDatabase();
});

describe("categories — seeding & resolution", () => {
  it("seeds the default set once, idempotently (deterministic ids)", async () => {
    await seedDefaultCategories(UID, "es");
    await seedDefaultCategories(UID, "es"); // a second device / reload
    const cats = await listCategories(UID);
    expect(cats).toHaveLength(DEFAULT_CATEGORIES.length);
    // Seeded ids are deterministic (merge, never duplicate).
    expect(cats.some((c) => c.id === categorySeedId(UID, "medico"))).toBe(true);
  });

  it("resolves category ids, healing legacy records", () => {
    expect(resolveCategoryId(UID, "explicit")).toBe("explicit");
    expect(resolveCategoryId(UID, undefined, "medico")).toBe(categorySeedId(UID, "medico"));
    expect(resolveCategoryId(UID, undefined)).toBe(defaultCategoryId(UID));
    expect(defaultCategoryId(UID)).toBe(categorySeedId(UID, "otros"));
  });
});

describe("categories — CRUD & isolation", () => {
  it("creates and deletes user categories", async () => {
    await seedDefaultCategories(UID, "es");
    const c = await createCategory(UID, { name: "Viajes", color: "oklch(0.6 0.1 200)", icon: "Plane" });
    expect((await listCategories(UID)).length).toBe(DEFAULT_CATEGORIES.length + 1);
    await deleteCategory(UID, c.id);
    expect((await listCategories(UID)).length).toBe(DEFAULT_CATEGORIES.length);
  });

  it("keeps categories isolated per user", async () => {
    await seedDefaultCategories(UID, "es");
    expect(await listCategories(OTHER)).toHaveLength(0);
    // Same slug → different id per user (no cross-user PK collision).
    expect(categorySeedId(UID, "medico")).not.toBe(categorySeedId(OTHER, "medico"));
  });
});
