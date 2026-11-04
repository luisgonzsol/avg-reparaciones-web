/**
 * Lógica de horario "Abierto ahora / Cerrado".
 * Siempre se calcula en la zona horaria del negocio (America/Caracas),
 * nunca con la hora del dispositivo del usuario.
 */

export type DayHours = { open: string; close: string } | null;
/** 0 = domingo … 6 = sábado */
export type WeeklySchedule = Record<0 | 1 | 2 | 3 | 4 | 5 | 6, DayHours>;

export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Día de la semana y minutos desde medianoche en la zona indicada. */
export function zonedNow(date: Date, timeZone: string): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = WEEKDAY_INDEX[get("weekday")] ?? 0;
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return { day, minutes: hour * 60 + minute };
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export type OpenStatus =
  { isOpen: true; closesAt: string } | { isOpen: false; nextOpen: { day: number; time: string } | null };

export function getOpenStatus(schedule: WeeklySchedule, date: Date, timeZone: string): OpenStatus {
  const { day, minutes } = zonedNow(date, timeZone);
  const today = schedule[day as keyof WeeklySchedule];

  if (today && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    return { isOpen: true, closesAt: today.close };
  }

  // Busca la próxima apertura: hoy más tarde o en los próximos 7 días.
  for (let offset = 0; offset <= 7; offset++) {
    const d = ((day + offset) % 7) as keyof WeeklySchedule;
    const hours = schedule[d];
    if (!hours) continue;
    if (offset === 0 && minutes >= toMinutes(hours.open)) continue;
    return { isOpen: false, nextOpen: { day: d, time: hours.open } };
  }
  return { isOpen: false, nextOpen: null };
}

/** "8:00" a partir de "08:00" (formato cercano, 24 h). */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  return `${Number(h)}:${m}`;
}

export function describeStatus(status: OpenStatus, currentDay: number): string {
  if (status.isOpen) return `Abierto ahora · cierra a las ${formatTime(status.closesAt)}`;
  if (!status.nextOpen) return "Cerrado";
  const { day, time } = status.nextOpen;
  const when =
    day === currentDay
      ? "hoy"
      : day === (currentDay + 1) % 7
        ? "mañana"
        : `el ${DAY_NAMES[day]?.toLowerCase()}`;
  return `Cerrado · abrimos ${when} a las ${formatTime(time)}`;
}

/** Agrupa días consecutivos con el mismo horario, empezando en lunes. */
export function groupSchedule(schedule: WeeklySchedule): { label: string; hours: string }[] {
  const order = [1, 2, 3, 4, 5, 6, 0] as const;
  const fmt = (h: DayHours) => (h ? `${formatTime(h.open)} – ${formatTime(h.close)}` : "Cerrado");

  const groups: { days: number[]; hours: string }[] = [];
  for (const d of order) {
    const hours = fmt(schedule[d]);
    const last = groups.at(-1);
    if (last && last.hours === hours) last.days.push(d);
    else groups.push({ days: [d], hours });
  }

  return groups.map(({ days, hours }) => {
    const first = DAY_NAMES[days[0]!];
    const lastDay = DAY_NAMES[days.at(-1)!];
    const label = days.length === 1 ? first : `${first} a ${lastDay?.toLowerCase()}`;
    return { label, hours };
  });
}
