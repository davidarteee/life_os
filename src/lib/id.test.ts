import { describe, it, expect } from "vitest";
import { newId, deterministicId } from "@/lib/id";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("newId", () => {
  it("produces a unique UUID each call", () => {
    const ids = new Set(Array.from({ length: 500 }, () => newId()));
    expect(ids.size).toBe(500);
    expect([...ids][0]).toMatch(UUID_RE);
  });
});

describe("deterministicId (idempotent seeding / singletons)", () => {
  it("returns the SAME id for the same seed (this is what prevents duplicates)", () => {
    expect(deterministicId("user-1:seed:seed.sleep")).toBe(deterministicId("user-1:seed:seed.sleep"));
    expect(deterministicId("user-1:game_state")).toBe(deterministicId("user-1:game_state"));
  });

  it("returns DIFFERENT ids for different seeds", () => {
    expect(deterministicId("user-1:seed:seed.sleep")).not.toBe(deterministicId("user-1:seed:seed.exercise"));
    expect(deterministicId("user-1:game_state")).not.toBe(deterministicId("user-2:game_state"));
    expect(deterministicId("user-1:game_state")).not.toBe(deterministicId("user-1:user_settings"));
  });

  it("is a valid UUID-format string (accepted by Postgres uuid columns)", () => {
    expect(deterministicId("anything")).toMatch(UUID_RE);
  });

  it("has no collisions across a realistic per-user namespace", () => {
    const seeds = [
      "seed.sleep", "seed.exercise", "seed.stretch", "seed.read", "seed.coldShower",
      "seed.noCheat", "seed.meditate", "seed.write", "seed.nutrition",
    ];
    const users = ["u-aaa", "u-bbb", "u-ccc"];
    const ids = new Set<string>();
    for (const u of users) {
      for (const s of seeds) ids.add(deterministicId(`${u}:seed:${s}`));
      ids.add(deterministicId(`${u}:game_state`));
      ids.add(deterministicId(`${u}:user_settings`));
    }
    expect(ids.size).toBe(users.length * (seeds.length + 2));
  });
});
