import type { Locale } from "@/lib/types";
import type { AchievementDefEx } from "@/lib/game/achievements-def";

/**
 * Localized content that is generated from templates (achievement milestones,
 * the fixed challenge pool) or is long-form (module "coming soon" bullets).
 * Kept here rather than in the flat dictionary because the values are functions
 * or arrays. English is always the fallback.
 */

type Loc = { title: string; description: string };

/* --------------------------------------------------------- Achievements -- */

interface AchTemplates {
  firstStep: Loc;
  habitsDone: (n: number) => Loc;
  tasksDone: (n: number) => Loc;
  streak: (n: number) => Loc;
  perfectDay: Loc;
  perfectDays: (n: number) => Loc;
  level: (n: number) => Loc;
  xp: (n: number) => Loc;
  redemption: Loc;
  challenges: (n: number) => Loc;
  phoenix: Loc;
  ironwill: Loc;
}

const ACH: Record<Locale, AchTemplates> = {
  en: {
    firstStep: { title: "First Step", description: "Complete 1 habit in total." },
    habitsDone: (n) => ({ title: `${n} Habits Done`, description: `Complete ${n} habits in total.` }),
    tasksDone: (n) => ({ title: `${n} Tasks Done`, description: `Complete ${n} tasks in total.` }),
    streak: (n) => ({ title: `${n}-Day Streak`, description: `Keep any habit alive for ${n} days straight.` }),
    perfectDay: { title: "Perfect Day", description: "Complete every required habit on 1 day." },
    perfectDays: (n) => ({ title: `${n} Perfect Days`, description: `Complete every required habit on ${n} days.` }),
    level: (n) => ({ title: `Level ${n}`, description: `Reach level ${n}.` }),
    xp: (n) => ({ title: `${n.toLocaleString()} XP`, description: `Earn ${n.toLocaleString()} lifetime XP.` }),
    redemption: { title: "Redemption", description: "Verify 1 comeback challenge after losing all lives." },
    challenges: (n) => ({ title: `${n} Challenges`, description: `Verify ${n} comeback challenges after losing all lives.` }),
    phoenix: { title: "Phoenix", description: "Rise from zero lives and verify the challenge the same day." },
    ironwill: { title: "Iron Will", description: "A hidden reward for relentless consistency." },
  },
  es: {
    firstStep: { title: "Primer paso", description: "Completa 1 hábito en total." },
    habitsDone: (n) => ({ title: `${n} hábitos completados`, description: `Completa ${n} hábitos en total.` }),
    tasksDone: (n) => ({ title: `${n} tareas completadas`, description: `Completa ${n} tareas en total.` }),
    streak: (n) => ({ title: `Racha de ${n} días`, description: `Mantén cualquier hábito ${n} días seguidos.` }),
    perfectDay: { title: "Día perfecto", description: "Completa todos los hábitos obligatorios en 1 día." },
    perfectDays: (n) => ({ title: `${n} días perfectos`, description: `Completa todos los hábitos obligatorios en ${n} días.` }),
    level: (n) => ({ title: `Nivel ${n}`, description: `Alcanza el nivel ${n}.` }),
    xp: (n) => ({ title: `${n.toLocaleString("es")} XP`, description: `Consigue ${n.toLocaleString("es")} XP totales.` }),
    redemption: { title: "Redención", description: "Verifica 1 reto de remontada tras perder todas las vidas." },
    challenges: (n) => ({ title: `${n} retos`, description: `Verifica ${n} retos de remontada tras perder todas las vidas.` }),
    phoenix: { title: "Fénix", description: "Renace desde cero vidas y verifica el reto el mismo día." },
    ironwill: { title: "Voluntad de hierro", description: "Una recompensa oculta por una constancia implacable." },
  },
  ca: {
    firstStep: { title: "Primer pas", description: "Completa 1 hàbit en total." },
    habitsDone: (n) => ({ title: `${n} hàbits completats`, description: `Completa ${n} hàbits en total.` }),
    tasksDone: (n) => ({ title: `${n} tasques completades`, description: `Completa ${n} tasques en total.` }),
    streak: (n) => ({ title: `Ratxa de ${n} dies`, description: `Mantén qualsevol hàbit ${n} dies seguits.` }),
    perfectDay: { title: "Dia perfecte", description: "Completa tots els hàbits obligatoris en 1 dia." },
    perfectDays: (n) => ({ title: `${n} dies perfectes`, description: `Completa tots els hàbits obligatoris en ${n} dies.` }),
    level: (n) => ({ title: `Nivell ${n}`, description: `Assoleix el nivell ${n}.` }),
    xp: (n) => ({ title: `${n.toLocaleString("ca")} XP`, description: `Aconsegueix ${n.toLocaleString("ca")} XP totals.` }),
    redemption: { title: "Redempció", description: "Verifica 1 repte de remuntada després de perdre totes les vides." },
    challenges: (n) => ({ title: `${n} reptes`, description: `Verifica ${n} reptes de remuntada després de perdre totes les vides.` }),
    phoenix: { title: "Fènix", description: "Reneix des de zero vides i verifica el repte el mateix dia." },
    ironwill: { title: "Voluntat de ferro", description: "Una recompensa oculta per una constància implacable." },
  },
};

export function describeAchievement(locale: Locale, def: AchievementDefEx): Loc {
  const tpl = ACH[locale] ?? ACH.en;
  const goal = def.goal ?? 1;
  const id = def.id;
  if (id === "hidden_phoenix") return tpl.phoenix;
  if (id === "hidden_ironwill") return tpl.ironwill;
  if (id.startsWith("habits_done_")) return goal === 1 ? tpl.firstStep : tpl.habitsDone(goal);
  if (id.startsWith("tasks_done_")) return tpl.tasksDone(goal);
  if (id.startsWith("habit_streak_")) return tpl.streak(goal);
  if (id.startsWith("perfect_days_")) return goal === 1 ? tpl.perfectDay : tpl.perfectDays(goal);
  if (id.startsWith("level_")) return tpl.level(goal);
  if (id.startsWith("xp_")) return tpl.xp(goal);
  if (id.startsWith("challenge_")) return goal === 1 ? tpl.redemption : tpl.challenges(goal);
  return { title: def.title, description: def.description };
}

/* ---------------------------------------------------------- Challenges --- */

type ChalLoc = { title: string; description: string; metricLabel: string };

const CHAL: Record<Locale, Record<string, ChalLoc>> = {
  en: {
    run_10k: { title: "Run 10 km", description: "Complete a single 10 km run today. Upload your GPS activity as proof.", metricLabel: "Distance (km)" },
    run_half: { title: "Half Marathon", description: "Run 21.1 km in one session. Strava/Suunto screenshot required.", metricLabel: "Distance (km)" },
    pushups_200: { title: "200 Push-ups", description: "Complete 200 push-ups across the day. Log your sets and add a photo.", metricLabel: "Total reps" },
    steps_25k: { title: "25,000 Steps", description: "Hit 25,000 steps today. Screenshot your step counter at the end of the day.", metricLabel: "Steps" },
    cycle_40k: { title: "Cycle 40 km", description: "Ride 40 km today. Upload the recorded activity.", metricLabel: "Distance (km)" },
    hike_1000d: { title: "1000 m Ascent Hike", description: "Hike a route with at least 1000 m of positive elevation. GPS track required.", metricLabel: "Elevation gain (m)" },
    burpees_100: { title: "100 Burpees for Time", description: "100 burpees as fast as possible. Record it or log your time with a photo.", metricLabel: "Time (mm:ss)" },
    swim_2k: { title: "Swim 2 km", description: "Swim 2 km in one session. Upload your pool/open-water log.", metricLabel: "Distance (m)" },
    plank_10: { title: "10-Minute Plank Total", description: "Accumulate 10 minutes of plank across sets today. Log each hold.", metricLabel: "Total time (min)" },
  },
  es: {
    run_10k: { title: "Corre 10 km", description: "Completa hoy una carrera de 10 km. Sube tu actividad GPS como prueba.", metricLabel: "Distancia (km)" },
    run_half: { title: "Media maratón", description: "Corre 21,1 km en una sesión. Captura de Strava/Suunto obligatoria.", metricLabel: "Distancia (km)" },
    pushups_200: { title: "200 flexiones", description: "Completa 200 flexiones a lo largo del día. Registra tus series y añade una foto.", metricLabel: "Repeticiones totales" },
    steps_25k: { title: "25.000 pasos", description: "Alcanza 25.000 pasos hoy. Captura tu contador de pasos al final del día.", metricLabel: "Pasos" },
    cycle_40k: { title: "Pedalea 40 km", description: "Recorre 40 km hoy en bici. Sube la actividad registrada.", metricLabel: "Distancia (km)" },
    hike_1000d: { title: "Ruta de 1000 m de desnivel", description: "Haz una ruta con al menos 1000 m de desnivel positivo. Se requiere track GPS.", metricLabel: "Desnivel (m)" },
    burpees_100: { title: "100 burpees por tiempo", description: "100 burpees lo más rápido posible. Grábalo o registra tu tiempo con una foto.", metricLabel: "Tiempo (mm:ss)" },
    swim_2k: { title: "Nada 2 km", description: "Nada 2 km en una sesión. Sube tu registro de piscina/aguas abiertas.", metricLabel: "Distancia (m)" },
    plank_10: { title: "10 minutos de plancha", description: "Acumula 10 minutos de plancha entre series hoy. Registra cada aguante.", metricLabel: "Tiempo total (min)" },
  },
  ca: {
    run_10k: { title: "Corre 10 km", description: "Completa avui una cursa de 10 km. Puja la teva activitat GPS com a prova.", metricLabel: "Distància (km)" },
    run_half: { title: "Mitja marató", description: "Corre 21,1 km en una sessió. Captura d'Strava/Suunto obligatòria.", metricLabel: "Distància (km)" },
    pushups_200: { title: "200 flexions", description: "Completa 200 flexions al llarg del dia. Registra les teves sèries i afegeix una foto.", metricLabel: "Repeticions totals" },
    steps_25k: { title: "25.000 passes", description: "Arriba a 25.000 passes avui. Captura el teu comptador de passes al final del dia.", metricLabel: "Passes" },
    cycle_40k: { title: "Pedala 40 km", description: "Recorre 40 km avui en bici. Puja l'activitat registrada.", metricLabel: "Distància (km)" },
    hike_1000d: { title: "Ruta de 1000 m de desnivell", description: "Fes una ruta amb almenys 1000 m de desnivell positiu. Cal track GPS.", metricLabel: "Desnivell (m)" },
    burpees_100: { title: "100 burpees per temps", description: "100 burpees el més ràpid possible. Grava-ho o registra el teu temps amb una foto.", metricLabel: "Temps (mm:ss)" },
    swim_2k: { title: "Neda 2 km", description: "Neda 2 km en una sessió. Puja el teu registre de piscina/aigües obertes.", metricLabel: "Distància (m)" },
    plank_10: { title: "10 minuts de planxa", description: "Acumula 10 minuts de planxa entre sèries avui. Registra cada aguantada.", metricLabel: "Temps total (min)" },
  },
};

export function describeChallenge(locale: Locale, id: string): ChalLoc {
  return (CHAL[locale] ?? CHAL.en)[id] ?? CHAL.en[id] ?? { title: id, description: "", metricLabel: "" };
}

/* ------------------------------------------------ "Coming soon" bullets -- */

const BULLETS: Record<Locale, Record<string, string[]>> = {
  en: {
    "nav.assistant": ["Ask questions about all your LifeOS data", "Weekly summaries and recommendations", "Learning-plan generation"],
    "nav.tasks": ["List, Kanban and calendar views", "Priorities, subtasks and recurrence", "Plan tasks onto specific days"],
    "nav.projects": ["Progress, deadlines and status", "Associated tasks, notes and links"],
    "nav.calendar": ["Monthly master calendar", "Tasks, exams, projects and free days", "Apple Calendar sync (roadmap)"],
    "nav.study": ["Subjects, exams and assignments", "Pomodoro-driven study sessions", "Total study-time analytics"],
    "nav.notes": ["Folders, pages and tags", "Markdown, checklists and images"],
    "nav.nutrition": ["Log meals with macros", "Targets vs consumed charts", "Food database and recipes"],
    "nav.workouts": ["Exercises, sets, reps and weight", "Progress tracking over time"],
    "nav.sleep": ["Hours, quality and trends", "8-hour target and streaks"],
    "nav.goals": ["5-year vision boards", "6-month vision cycles with history"],
    "nav.learning": ["Topics, subtopics and references", "AI-assisted learning plans"],
    "nav.books": ["Want to read / reading / done", "Progress, ratings and notes"],
    "nav.movies": ["Watchlist and progress", "Ratings and notes"],
    "nav.music": ["Spotify mini-player (OAuth)", "Now playing, playlists, search"],
    "nav.contacts": ["Birthdays on the calendar", "Relationships and notes"],
    "nav.travel": ["Trips, budgets and itineraries", "Checklists and documents"],
    "nav.wishlist": ["Custom lists with prices and links", "Priorities and categories"],
    "nav.investments": ["Transactions and portfolio value", "Near-real-time market prices", "Manual + CSV import fallbacks"],
    "nav.finance": ["Income, expenses and budgets", "Categories and subscriptions"],
    "nav.databases": ["Notion-style table views", "Filter, sort, search and edit"],
  },
  es: {
    "nav.assistant": ["Pregunta sobre todos tus datos de LifeOS", "Resúmenes y recomendaciones semanales", "Generación de planes de aprendizaje"],
    "nav.tasks": ["Vistas de lista, Kanban y calendario", "Prioridades, subtareas y recurrencia", "Planifica tareas en días concretos"],
    "nav.projects": ["Progreso, fechas límite y estado", "Tareas, notas y enlaces asociados"],
    "nav.calendar": ["Calendario mensual principal", "Tareas, exámenes, proyectos y días libres", "Sincronización con Apple Calendar (hoja de ruta)"],
    "nav.study": ["Asignaturas, exámenes y entregas", "Sesiones de estudio con Pomodoro", "Analíticas de tiempo total de estudio"],
    "nav.notes": ["Carpetas, páginas y etiquetas", "Markdown, listas y imágenes"],
    "nav.nutrition": ["Registra comidas con macros", "Gráficas de objetivo vs consumido", "Base de datos de alimentos y recetas"],
    "nav.workouts": ["Ejercicios, series, repeticiones y peso", "Seguimiento del progreso en el tiempo"],
    "nav.sleep": ["Horas, calidad y tendencias", "Objetivo de 8 horas y rachas"],
    "nav.goals": ["Tableros de visión a 5 años", "Ciclos de visión a 6 meses con historial"],
    "nav.learning": ["Temas, subtemas y referencias", "Planes de aprendizaje asistidos por IA"],
    "nav.books": ["Por leer / leyendo / terminados", "Progreso, valoraciones y notas"],
    "nav.movies": ["Lista de seguimiento y progreso", "Valoraciones y notas"],
    "nav.music": ["Mini-reproductor de Spotify (OAuth)", "Reproduciendo, listas y búsqueda"],
    "nav.contacts": ["Cumpleaños en el calendario", "Relaciones y notas"],
    "nav.travel": ["Viajes, presupuestos e itinerarios", "Listas de comprobación y documentos"],
    "nav.wishlist": ["Listas personalizadas con precios y enlaces", "Prioridades y categorías"],
    "nav.investments": ["Transacciones y valor de la cartera", "Precios de mercado casi en tiempo real", "Alternativas de entrada manual + CSV"],
    "nav.finance": ["Ingresos, gastos y presupuestos", "Categorías y suscripciones"],
    "nav.databases": ["Vistas de tabla estilo Notion", "Filtra, ordena, busca y edita"],
  },
  ca: {
    "nav.assistant": ["Pregunta sobre totes les teves dades de LifeOS", "Resums i recomanacions setmanals", "Generació de plans d'aprenentatge"],
    "nav.tasks": ["Vistes de llista, Kanban i calendari", "Prioritats, subtasques i recurrència", "Planifica tasques en dies concrets"],
    "nav.projects": ["Progrés, dates límit i estat", "Tasques, notes i enllaços associats"],
    "nav.calendar": ["Calendari mensual principal", "Tasques, exàmens, projectes i dies lliures", "Sincronització amb Apple Calendar (full de ruta)"],
    "nav.study": ["Assignatures, exàmens i lliuraments", "Sessions d'estudi amb Pomodoro", "Analítiques del temps total d'estudi"],
    "nav.notes": ["Carpetes, pàgines i etiquetes", "Markdown, llistes i imatges"],
    "nav.nutrition": ["Registra àpats amb macros", "Gràfics d'objectiu vs consumit", "Base de dades d'aliments i receptes"],
    "nav.workouts": ["Exercicis, sèries, repeticions i pes", "Seguiment del progrés en el temps"],
    "nav.sleep": ["Hores, qualitat i tendències", "Objectiu de 8 hores i ratxes"],
    "nav.goals": ["Taulers de visió a 5 anys", "Cicles de visió a 6 mesos amb historial"],
    "nav.learning": ["Temes, subtemes i referències", "Plans d'aprenentatge assistits per IA"],
    "nav.books": ["Per llegir / llegint / acabats", "Progrés, valoracions i notes"],
    "nav.movies": ["Llista de seguiment i progrés", "Valoracions i notes"],
    "nav.music": ["Mini-reproductor d'Spotify (OAuth)", "Reproduint, llistes i cerca"],
    "nav.contacts": ["Aniversaris al calendari", "Relacions i notes"],
    "nav.travel": ["Viatges, pressupostos i itineraris", "Llistes de comprovació i documents"],
    "nav.wishlist": ["Llistes personalitzades amb preus i enllaços", "Prioritats i categories"],
    "nav.investments": ["Transaccions i valor de la cartera", "Preus de mercat gairebé en temps real", "Alternatives d'entrada manual + CSV"],
    "nav.finance": ["Ingressos, despeses i pressupostos", "Categories i subscripcions"],
    "nav.databases": ["Vistes de taula a l'estil Notion", "Filtra, ordena, cerca i edita"],
  },
};

export function moduleBullets(locale: Locale, key: string): string[] {
  return (BULLETS[locale] ?? BULLETS.en)[key] ?? BULLETS.en[key] ?? [];
}
