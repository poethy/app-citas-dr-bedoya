import { describe, expect, test } from "@jest/globals";

import { diaDelMes, diaSemanaCorto, diasHasta, fechaCorta, fechaLarga, horaCorta, textoRecordatorio } from "@/utils/fechas";

// Jueves 19 de noviembre de 2026, 11:00 a. m. en Bogotá = 16:00 UTC
const citaJueves = new Date("2026-11-19T16:00:00Z");

describe("fechas en la zona de Bogotá", () => {
  test("hora corta con a. m., p. m. y mediodía", () => {
    expect(horaCorta(citaJueves)).toBe("11:00 a. m.");
    expect(horaCorta(new Date("2026-11-19T18:30:00Z"))).toBe("1:30 p. m.");
    expect(horaCorta(new Date("2026-11-19T17:00:00Z"))).toBe("12:00 m.");
    expect(horaCorta(new Date("2026-11-19T13:00:00Z"))).toBe("8:00 a. m.");
    expect(horaCorta(new Date("2026-11-20T05:00:00Z"))).toBe("12:00 a. m.");
  });

  test("día de la semana y del mes como en la tarjeta de cita", () => {
    expect(diaSemanaCorto(citaJueves)).toBe("JUE");
    expect(diaDelMes(citaJueves)).toBe(19);
    // 2:00 UTC del 20 sigue siendo el 19 en Bogotá
    expect(diaDelMes(new Date("2026-11-20T02:00:00Z"))).toBe(19);
  });

  test("fecha corta y larga", () => {
    expect(fechaCorta(citaJueves)).toBe("Jue 19 nov, 11:00 a. m.");
    expect(fechaLarga(citaJueves)).toBe("Jueves 19 de noviembre");
  });

  test("días hasta la cita según el calendario de Bogotá", () => {
    const miercolesNoche = new Date("2026-11-19T03:00:00Z"); // miércoles 18, 10:00 p. m. en Bogotá
    expect(diasHasta(citaJueves, miercolesNoche)).toBe(1);
    expect(diasHasta(citaJueves, new Date("2026-11-19T12:00:00Z"))).toBe(0);
  });

  test("texto del recordatorio de P01", () => {
    expect(textoRecordatorio(citaJueves, new Date("2026-11-18T15:00:00Z"))).toBe(
      "Recordatorio: tu cita es mañana a las 11:00 a. m.",
    );
    expect(textoRecordatorio(citaJueves, new Date("2026-11-19T12:00:00Z"))).toBe(
      "Recordatorio: tu cita es hoy a las 11:00 a. m.",
    );
    expect(textoRecordatorio(citaJueves, new Date("2026-11-16T15:00:00Z"))).toBeNull();
    expect(textoRecordatorio(citaJueves, new Date("2026-11-19T17:00:00Z"))).toBeNull();
  });
});
