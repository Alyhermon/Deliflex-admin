// Utilidades compartidas para leer store_schedules y mostrar/objeto de horario.
// day_of_week sigue la misma convencion que JS Date.getDay(): 0 = Domingo.

export type ScheduleRow = {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean | null;
};

const NOMBRES_DIA = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

// Orden de lectura natural: Lunes -> Domingo.
const ORDEN_LUNES_A_DOMINGO = [1, 2, 3, 4, 5, 6, 0];

// "08:00" -> "8:00 am"
const aHora12 = (hhmm: string) => {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  const periodo = h >= 12 ? "pm" : "am";
  const hora12 = h % 12 === 0 ? 12 : h % 12;

  return `${hora12}:${String(m).padStart(2, "0")} ${periodo}`;
};

/**
 * Arma un texto tipo "Lunes - Domingo, 8:00 am a 9:00 pm", agrupando
 * los dias consecutivos que comparten el mismo horario. Si el negocio
 * tiene horarios distintos por bloques, devuelve varios grupos separados
 * por " · ". Si no hay horarios guardados, devuelve null.
 */
export const formatScheduleRanges = (
  schedules: ScheduleRow[] | undefined | null,
): string | null => {
  if (!schedules || schedules.length === 0) return null;

  const porDia = new Map(schedules.map((s) => [s.day_of_week, s]));

  const dias = ORDEN_LUNES_A_DOMINGO.map((dayOfWeek) => {
    const fila = porDia.get(dayOfWeek);

    if (!fila || fila.is_closed || !fila.open_time || !fila.close_time) {
      return { dayOfWeek, cerrado: true, firma: "CERRADO" };
    }

    const open = fila.open_time.slice(0, 5);
    const close = fila.close_time.slice(0, 5);

    return { dayOfWeek, cerrado: false, firma: `${open}-${close}`, open, close };
  });

  const grupos: { desde: number; hasta: number; texto: string }[] = [];

  for (const dia of dias) {
    const ultimo = grupos[grupos.length - 1];
    const texto = dia.cerrado
      ? "Cerrado"
      : `${aHora12(dia.open!)} a ${aHora12(dia.close!)}`;

    if (ultimo && ultimo.texto === texto) {
      ultimo.hasta = dia.dayOfWeek;
    } else {
      grupos.push({ desde: dia.dayOfWeek, hasta: dia.dayOfWeek, texto });
    }
  }

  return grupos
    .map((g) => {
      const etiqueta =
        g.desde === g.hasta
          ? NOMBRES_DIA[g.desde]
          : `${NOMBRES_DIA[g.desde]} - ${NOMBRES_DIA[g.hasta]}`;

      return `${etiqueta}, ${g.texto}`;
    })
    .join(" · ");
};

/**
 * true/false segun el horario de hoy. null si no hay horarios guardados
 * (el llamador decide un valor por defecto en ese caso).
 */
export const isStoreOpenNow = (
  schedules: ScheduleRow[] | undefined | null,
  ahora: Date = new Date(),
): boolean | null => {
  if (!schedules || schedules.length === 0) return null;

  const hoy = schedules.find((s) => s.day_of_week === ahora.getDay());

  if (!hoy || hoy.is_closed || !hoy.open_time || !hoy.close_time) return false;

  const horaActual = ahora.getHours() * 60 + ahora.getMinutes();

  const [oh, om] = hoy.open_time.slice(0, 5).split(":").map(Number);
  const [ch, cm] = hoy.close_time.slice(0, 5).split(":").map(Number);
  const apertura = oh * 60 + om;
  const cierre = ch * 60 + cm;

  // Horario que cruza medianoche (ej. 6:00 pm a 2:00 am).
  if (cierre <= apertura) {
    return horaActual >= apertura || horaActual < cierre;
  }

  return horaActual >= apertura && horaActual < cierre;
};
