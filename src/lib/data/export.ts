import { db } from "@/lib/db/dexie";
import { activeRecords } from "@/lib/data/repository";
import { allLogs, listHabits } from "@/lib/data/habits";

/** Full JSON export of a user's local data — portable and human-readable. */
export async function exportUserJSON(userId: string): Promise<string> {
  const database = db();
  const [habits, habitLogs, gameState, xpEvents, freeDays, purchases, achievements, challenges, settings] = await Promise.all([
    database.habits.where("user_id").equals(userId).toArray(),
    database.habitLogs.where("user_id").equals(userId).toArray(),
    database.gameState.where("user_id").equals(userId).toArray(),
    database.xpEvents.where("user_id").equals(userId).toArray(),
    database.freeDays.where("user_id").equals(userId).toArray(),
    database.shopPurchases.where("user_id").equals(userId).toArray(),
    database.userAchievements.where("user_id").equals(userId).toArray(),
    database.challenges.where("user_id").equals(userId).toArray(),
    database.settings.where("user_id").equals(userId).toArray(),
  ]);
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "LifeOS",
    version: 1,
    data: {
      habits: activeRecords(habits),
      habitLogs: activeRecords(habitLogs),
      gameState: activeRecords(gameState),
      xpEvents: activeRecords(xpEvents),
      freeDays: activeRecords(freeDays),
      shopPurchases: activeRecords(purchases),
      userAchievements: activeRecords(achievements),
      challenges: activeRecords(challenges),
      settings: activeRecords(settings),
    },
  };
  return JSON.stringify(payload, null, 2);
}

/** Habit completion log as CSV (habit, day, count, completed). */
export async function exportHabitsCSV(userId: string): Promise<string> {
  const [habits, logs] = await Promise.all([listHabits(userId, true), allLogs(userId)]);
  const nameById = new Map(habits.map((h) => [h.id, h.name]));
  const rows = [["habit", "day", "count", "completed"]];
  for (const l of logs.sort((a, b) => a.day.localeCompare(b.day))) {
    rows.push([csv(nameById.get(l.habitId) ?? l.habitId), l.day, String(l.count), String(l.completed)]);
  }
  return rows.map((r) => r.join(",")).join("\n");
}

function csv(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Trigger a client-side file download. */
export function downloadFile(filename: string, content: string, mime = "application/json") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
