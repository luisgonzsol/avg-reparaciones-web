import { describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site";
import { describeStatus, getOpenStatus, groupSchedule, zonedNow } from "@/lib/schedule";

const TZ = "America/Caracas"; // UTC-4 todo el año (sin horario de verano)
const schedule = siteConfig.schedule;

// Ayudante: fecha en hora de Caracas expresada como UTC (+4 h).
const caracas = (iso: string) => new Date(`${iso}-04:00`);

describe("zonedNow", () => {
  it("usa la hora de Caracas y no la del sistema", () => {
    // 2026-11-04 03:30 UTC = 2026-11-03 (martes) 23:30 en Caracas
    expect(zonedNow(new Date("2026-11-04T03:30:00Z"), TZ)).toEqual({ day: 2, minutes: 23 * 60 + 30 });
  });

  it("maneja la medianoche", () => {
    expect(zonedNow(caracas("2026-11-04T00:00:00"), TZ)).toEqual({ day: 3, minutes: 0 });
  });
});

describe("getOpenStatus", () => {
  it("abierto un miércoles a media mañana", () => {
    const s = getOpenStatus(schedule, caracas("2026-11-04T10:15:00"), TZ);
    expect(s).toEqual({ isOpen: true, closesAt: "17:00" });
  });

  it("abre justo a las 8:00 y cierra justo a las 17:00", () => {
    expect(getOpenStatus(schedule, caracas("2026-11-04T08:00:00"), TZ).isOpen).toBe(true);
    expect(getOpenStatus(schedule, caracas("2026-11-04T16:59:00"), TZ).isOpen).toBe(true);
    expect(getOpenStatus(schedule, caracas("2026-11-04T17:00:00"), TZ).isOpen).toBe(false);
  });

  it("antes de abrir indica que abre hoy", () => {
    const s = getOpenStatus(schedule, caracas("2026-11-04T07:00:00"), TZ);
    expect(s).toEqual({ isOpen: false, nextOpen: { day: 3, time: "08:00" } });
    expect(describeStatus(s, 3)).toBe("Cerrado · abrimos hoy a las 8:00");
  });

  it("después de cerrar indica que abre mañana", () => {
    const s = getOpenStatus(schedule, caracas("2026-11-04T18:00:00"), TZ);
    expect(describeStatus(s, 3)).toBe("Cerrado · abrimos mañana a las 8:00");
  });

  it("sábado cierra a las 14:00", () => {
    expect(getOpenStatus(schedule, caracas("2026-11-07T13:59:00"), TZ).isOpen).toBe(true);
    const s = getOpenStatus(schedule, caracas("2026-11-07T14:00:00"), TZ);
    expect(s.isOpen).toBe(false);
    // domingo cerrado → el próximo es el lunes
    expect(describeStatus(s, 6)).toBe("Cerrado · abrimos el lunes a las 8:00");
  });

  it("domingo cerrado todo el día", () => {
    const s = getOpenStatus(schedule, caracas("2026-11-08T11:00:00"), TZ);
    expect(s.isOpen).toBe(false);
    expect(describeStatus(s, 0)).toBe("Cerrado · abrimos mañana a las 8:00");
  });

  it("un horario sin días abiertos devuelve cerrado sin próxima apertura", () => {
    const closed = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
    expect(getOpenStatus(closed, new Date(), TZ)).toEqual({ isOpen: false, nextOpen: null });
  });
});

describe("groupSchedule", () => {
  it("agrupa días consecutivos con el mismo horario", () => {
    expect(groupSchedule(schedule)).toEqual([
      { label: "Lunes a viernes", hours: "8:00 – 17:00" },
      { label: "Sábado", hours: "8:00 – 14:00" },
      { label: "Domingo", hours: "Cerrado" },
    ]);
  });
});
