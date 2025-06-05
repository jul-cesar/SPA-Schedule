"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const generateTimeSlots = (openTime: string, closeTime: string): string[] => {
  const slots: string[] = [];
  let currentTime = new Date(`2000-01-01T${openTime}:00`);
  const endTime = new Date(`2000-01-01T${closeTime}:00`);

  while (currentTime < endTime) {
    slots.push(currentTime.toTimeString().slice(0, 5));
    currentTime = new Date(currentTime.getTime() + 30 * 60000);
  }

  return slots;
};

type Response<T> = {
  success: boolean;
  message: string;
  data?: T;
};

type AvailableDates = {
  date: string;
  availableTimes: string[];
  isClosed: boolean;
};

export const getAvailableDates = async (
  date: string,
  idTrabajador: string
): Promise<Response<AvailableDates>> => {
  if (!date) {
    return {
      success: false,
      message: "Fecha no proporcionada",
    };
  }

  try {
    const isClosed = await prisma.diaCerradoGlobal.findUnique({
      where: {
        fecha: new Date(date),
      },
    });

    if (isClosed) {
      return {
        success: false,
        message: "La fecha seleccionada está cerrada",
        data: {
          date,
          availableTimes: [],
          isClosed: true,
        },
      };
    }

    const isFechaHoraAvailable = await prisma.diaCerradoTrabajador.findUnique({
      where: {
        trabajadorId_fecha: {
          trabajadorId: idTrabajador,
          fecha: new Date(date),
        },
      },
    });

    if (isFechaHoraAvailable) {
      return {
        success: false,
        message: "La fecha seleccionada está cerrada para el trabajador",
        data: {
          date,
          availableTimes: [],
          isClosed: true,
        },
      };
    }

    const diaEspecial = await prisma.diaEspecial.findUnique({
      where: {
        trabajadorId: idTrabajador,
        fecha: new Date(date),
      },
    });

    let slots: string[] = [];

    if (diaEspecial) {
      const openTime = diaEspecial.horaInicio || "08:00";
      const closeTime = diaEspecial.horaFin || "17:00";

      slots = generateTimeSlots(openTime, closeTime);
    } else {
      slots = generateTimeSlots("08:00", "17:00");
    }

    const citas = await prisma.cita.findMany({
      where: {
        trabajadorId: idTrabajador,
        fechaHora: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`),
        },
      },
    });

    const occupiedSlots = citas.map((cita) =>
      cita.fechaHora.toTimeString().slice(0, 5)
    );
    const availableSlots = slots.filter(
      (slot) => !occupiedSlots.includes(slot)
    );

    return {
      success: true,
      message: "Fechas disponibles obtenidas correctamente",
      data: {
        date,
        availableTimes: availableSlots,
        isClosed: false,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al obtener las fechas disponibles",
    };
  }
};

export const createTrabajador = async (
  nuevoTrabajador: Omit<Prisma.TrabajadorCreateInput, "servicios"> & {
    serviciosIds?: string[];
  }
): Promise<
  Response<
    Prisma.TrabajadorGetPayload<{
      include: {
        servicios: true;
      };
    }>
  >
> => {
  try {
    if (!nuevoTrabajador) {
      return {
        success: false,
        message: "Datos del trabajador no proporcionados",
      };
    }

    const { serviciosIds, ...trabajadorData } = nuevoTrabajador;

    const trabajador = await prisma.trabajador.create({
      data: {
        ...trabajadorData,
        servicios:
          serviciosIds && serviciosIds.length > 0
            ? {
                connect: serviciosIds.map((id) => ({ id })),
              }
            : undefined,
      },
      include: {
        servicios: true,
      },
    });
    return {
      success: true,
      message: "Trabajador creado correctamente",
      data: trabajador,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al crear el trabajador",
    };
  }
};
export const createservicio = async (
  nuevoServicio: Omit<Prisma.ServicioCreateInput, "trabajadores"> & {
    trabajadoresIds?: string[];
  }
): Promise<
  Response<
    Prisma.ServicioGetPayload<{
      include: {
        trabajadores: true;
      };
    }>
  >
> => {
  try {
    if (!nuevoServicio) {
      return {
        success: false,
        message: "Datos del servicio no proporcionados",
      };
    }

    const { trabajadoresIds, ...servicioData } = nuevoServicio;

    const servicio = await prisma.servicio.create({
      data: {
        ...servicioData,
        trabajadores:
          trabajadoresIds && trabajadoresIds.length > 0
            ? {
                connect: trabajadoresIds.map((id) => ({ id })),
              }
            : undefined,
      },
      include: {
        trabajadores: true,
      },
    });
    return {
      success: true,
      message: "Servicio creado correctamente",
      data: servicio,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al crear el servicio",
    };
  }
};

export const getTrabajadores = async (): Promise<
  Response<
    Prisma.TrabajadorGetPayload<{
      include: {
        servicios: true;
      };
    }>[]
  >
> => {
  try {
    const trabajadores = await prisma.trabajador.findMany({
      include: {
        servicios: true,
      },
    });

    return {
      success: true,
      message: "Trabajadores obtenidos correctamente",
      data: trabajadores,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al obtener los trabajadores",
    };
  }
};

export const getServicios = async (): Promise<
  Response<
    Prisma.ServicioGetPayload<{
      include: {
        trabajadores: true;
      };
    }>[]
  >
> => {
  try {
    const servicios = await prisma.servicio.findMany({
      include: {
        trabajadores: true,
      },
    });

    return {
      success: true,
      message: "Servicios obtenidos correctamente",
      data: servicios,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al obtener los servicios",
    };
  }
};

export const updateTrabajador = async (
  id: string,
  datosActualizados: Omit<Prisma.TrabajadorUpdateInput, "servicios"> & {
    serviciosIds?: string[];
  }
): Promise<
  Response<
    Prisma.TrabajadorGetPayload<{
      include: {
        servicios: true;
      };
    }>
  >
> => {
  try {
    if (!datosActualizados) {
      return {
        success: false,
        message: "Datos del trabajador no proporcionados",
      };
    }

    const { serviciosIds, ...trabajadorData } = datosActualizados;

    const trabajadorActual = await prisma.trabajador.findUnique({
      where: { id },
      include: { servicios: true },
    });

    if (!trabajadorActual) {
      return {
        success: false,
        message: "Trabajador no encontrado",
      };
    }

    // Actualizamos el trabajador y sus relaciones
    const trabajador = await prisma.trabajador.update({
      where: { id },
      data: {
        ...trabajadorData,
        servicios: {
          disconnect: trabajadorActual.servicios.map((s) => ({ id: s.id })),

          connect:
            serviciosIds && serviciosIds.length > 0
              ? serviciosIds.map((id) => ({ id }))
              : [],
        },
      },
      include: {
        servicios: true,
      },
    });

    return {
      success: true,
      message: "Trabajador actualizado correctamente",
      data: trabajador,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al actualizar el trabajador",
    };
  }
};

export const updateServicio = async (
  id: string,
  datosActualizados: Omit<Prisma.ServicioUpdateInput, "trabajadores"> & {
    trabajadoresIds?: string[];
  }
): Promise<
  Response<
    Prisma.ServicioGetPayload<{
      include: {
        trabajadores: true;
      };
    }>
  >
> => {
  try {
    if (!datosActualizados) {
      return {
        success: false,
        message: "Datos del servicio no proporcionados",
      };
    }

    const { trabajadoresIds, ...servicioData } = datosActualizados;

    const servicioActual = await prisma.servicio.findUnique({
      where: { id },
      include: { trabajadores: true },
    });

    if (!servicioActual) {
      return {
        success: false,
        message: "Servicio no encontrado",
      };
    }

    const servicio = await prisma.servicio.update({
      where: { id },
      data: {
        ...servicioData,
        trabajadores: {
          disconnect: servicioActual.trabajadores.map((t) => ({ id: t.id })),
          connect:
            trabajadoresIds && trabajadoresIds.length > 0
              ? trabajadoresIds.map((id) => ({ id }))
              : [],
        },
      },
      include: {
        trabajadores: true,
      },
    });

    return {
      success: true,
      message: "Servicio actualizado correctamente",
      data: servicio,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al actualizar el servicio",
    };
  }
};
