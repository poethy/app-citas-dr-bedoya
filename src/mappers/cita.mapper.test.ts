import { describe, expect, test } from "@jest/globals";

import { mapCita } from "@/mappers/cita.mapper";
import { codigoCita, esActiva } from "@/models/cita";
import type { CitaConServicioRespuesta } from "@/types/api";

const respuesta: CitaConServicioRespuesta = {
  id: "c1",
  numero: 1024,
  inicio: "2026-11-19T16:00:00+00:00",
  fin: "2026-11-19T16:45:00+00:00",
  estado: "confirmada",
  servicio: { nombre: "Limpieza dental", duracion_min: 45 },
};

describe("mapCita", () => {
  test("convierte la respuesta de la API en el modelo de la app", () => {
    const cita = mapCita(respuesta);
    expect(cita).toEqual({
      id: "c1",
      numero: 1024,
      inicio: new Date("2026-11-19T16:00:00Z"),
      fin: new Date("2026-11-19T16:45:00Z"),
      estado: "confirmada",
      servicio: { nombre: "Limpieza dental", duracionMin: 45 },
    });
    expect(codigoCita(cita)).toBe("#A-1024");
    expect(esActiva(cita)).toBe(true);
  });

  test("sin servicio en la respuesta usa la duración de la cita", () => {
    const cita = mapCita({ ...respuesta, servicio: null });
    expect(cita.servicio).toEqual({ nombre: "Servicio", duracionMin: 45 });
  });

  test("las canceladas no ocupan franja", () => {
    expect(esActiva(mapCita({ ...respuesta, estado: "cancelada" }))).toBe(false);
  });
});
