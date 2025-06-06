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

export const getunavailableDates = async (
  idTrabajador: string
): Promise<Response<string[]>> => {
  try {
    const closedDates = await prisma.diaCerradoTrabajador.findMany({
      where: {
        trabajadorId: idTrabajador,
      },
      select: {
        fecha: true,
      },
    });

    const globalClosedDates = await prisma.diaCerradoGlobal.findMany({
      select: {
        fecha: true,
      },
    });

   
    const unavailableDates = [
      ...closedDates.map((date) => {
       
        const d = new Date(date.fecha);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      }),
      ...globalClosedDates.map((date) => {
   
        const d = new Date(date.fecha);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      }),
    ];
    
    console.log("Unavailable dates:", unavailableDates);
    
    return {
      success: true,
      message: "Fechas no disponibles obtenidas correctamente",
      data: unavailableDates,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al obtener las fechas no disponibles",
    };
  }
};

export const getAvailableDates = async (
  date: string,
  idTrabajador: string,
  duracionMinutos: number = 30
): Promise<Response<AvailableDates>> => {
  console.log(
    "getAvailableDates called with date:",
    date,
    "idTrabajador:",
    idTrabajador,
    "duracion:",
    duracionMinutos
  );
  
  if (!date) {
    return {
      success: false,
      message: "Fecha no proporcionada",
    };
  }

  try {
    const [year, month, day] = date.split('-').map(Number);
    const dateUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    
    console.log("Checking availability for UTC date:", dateUTC.toISOString());
    
    const isClosed = await prisma.diaCerradoGlobal.findFirst({
      where: {
        fecha: {
          gte: new Date(Date.UTC(year, month - 1, day, 0, 0, 0)),
          lt: new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0)),
        }
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

    const isFechaHoraAvailable = await prisma.diaCerradoTrabajador.findFirst({
      where: {
        trabajadorId: idTrabajador,
        fecha: {
          gte: new Date(Date.UTC(year, month - 1, day, 0, 0, 0)),
          lt: new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0)),
        }
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

    const diaEspecial = await prisma.diaEspecial.findFirst({
      where: {
        trabajadorId: idTrabajador,
        fecha: {
          gte: new Date(Date.UTC(year, month - 1, day, 0, 0, 0)),
          lt: new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0)),
        }
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

    // Find appointments on this day using UTC dates
    const citas = await prisma.cita.findMany({
      where: {
        trabajadorId: idTrabajador,
        fechaHora: {
          gte: new Date(Date.UTC(year, month - 1, day, 0, 0, 0)),
          lt: new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0)),
        }
      },
      include: {
        servicio: true,
      },
    });

    const blockedSlots = new Set<string>();

    citas.forEach((cita) => {
      const startTime = cita.fechaHora;
      const citaDuracion = cita.servicio?.duracionMinutos || 30;
      
      // Get time part only in local timezone
      const startSlot = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
      blockedSlots.add(startSlot);

      const slotsToBlock = Math.ceil(citaDuracion / 30);

      if (slotsToBlock > 1) {
        let currentTime = new Date(startTime);
        for (let i = 1; i < slotsToBlock; i++) {
          currentTime = new Date(currentTime.getTime() + 30 * 60000); 
          const nextSlot = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
          blockedSlots.add(nextSlot);
        }
      }
    });

    const requestedServiceSlots = Math.ceil(duracionMinutos / 30);

    const availableSlots = slots.filter((slot) => {
      if (blockedSlots.has(slot)) return false;

      if (requestedServiceSlots > 1) {
        const [hours, minutes] = slot.split(":").map(Number);
        let slotTime = new Date(2000, 0, 1, hours, minutes);
        
        for (let i = 1; i < requestedServiceSlots; i++) {
          slotTime = new Date(slotTime.getTime() + 30 * 60000);
          const nextSlot = slotTime.toTimeString().slice(0, 5);
          
          if (blockedSlots.has(nextSlot) || !slots.includes(nextSlot)) {
            return false;
          }
        }
      }

      return true;
    });

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
export const getServicioById = async (
  id: string
): Promise<
  | Response<
      Prisma.ServicioGetPayload<{
        include: {
          trabajadores: true;
        };
      }>
    >
  | undefined
> => {
  try {
    if (!id) {
      return {
        success: false,
        message: "ID de servicio no proporcionado",
      };
    }

    const servicio = await prisma.servicio.findUnique({
      where: { id },
      include: { trabajadores: true },
    });

    if (!servicio) {
      return {
        success: false,
        message: "Servicio no encontrado",
      };
    }

    return {
      success: true,
      message: "Servicio obtenido correctamente",
      data: servicio,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al obtener el servicio",
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

export const createCita = async (nuevaCita: {
  servicioId: string;
  trabajadorId: string;
  clienteId: string;
  fechahora: string;
}): Promise<
  | Response<
      Prisma.CitaGetPayload<{
        include: {
          trabajador: true;
          servicio: true;
        };
      }>
    >
  | undefined
> => {
  try {
    if (!nuevaCita) {
      return {
        success: false,
        message: "Datos de la cita no proporcionados",
      };
    }

    const cita = await prisma.cita.create({
      data: {
        fechaHora: nuevaCita.fechahora,
        trabajadorId: nuevaCita.trabajadorId,
        servicioId: nuevaCita.servicioId,
        clienteId: nuevaCita.clienteId,
      },
      include: {
        trabajador: true,
        servicio: true,
      },
    });

    return {
      success: true,
      message: "Cita creada correctamente",
      data: cita,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al crear la cita",
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
      orderBy: {
        nombre: "asc",
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

export const getCitas = async (
): Promise<
  Response<
    Prisma.CitaGetPayload<{
      include: {
        trabajador: true;
        servicio: true;
        cliente: true;
      };
    }>[]
  > | undefined
> => {
  try {
    const citas = await prisma.cita.findMany({
      include: {
        trabajador: true,
        servicio: true,
        cliente: true,
      },
      orderBy: {
        fechaHora: "asc",
      },
    });

    return {
      success: true,
      message: "Citas obtenidas correctamente",
      data: citas,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al obtener las citas",
    };
  }
}


export const updateCitaStatus = async (
  id: string,
  status: Prisma.CitaUpdateInput["estado"]
): Promise<
  Response<
    Prisma.CitaGetPayload<{
      include: {
        trabajador: true;
        servicio: true;
        cliente: true;
      };
    }>
  >
> => {    
  console.log("updateCitaStatus called with id:", id, "status:", status);
  try {
    if (!id || !status) {
      return {
        success: false,
        message: "ID de cita o estado no proporcionados",
      };
    }

    const cita = await prisma.cita.update({
      where: { id },
      data: { estado: status },
      include: {
        trabajador: true,
        servicio: true,
        cliente: true,
      },
    });

    return {
      success: true,
      message: "Estado de la cita actualizado correctamente",
      data: cita,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al actualizar el estado de la cita",
    };
  }
}

export const getCurrentUserCitas = async (
  userId: string
): Promise<
  Response<
    Prisma.CitaGetPayload<{
      include: {
        trabajador: true;
        servicio: true;
      };
    }>[]
  > | undefined
> => {
  try {
    if (!userId) {
      return {
        success: false,
        message: "ID de usuario no proporcionado",
      };
    }

    const citas = await prisma.cita.findMany({
      where: {
        clienteId: userId,
      },
      include: {
        trabajador: true,
        servicio: true,
      },
      orderBy: {
        fechaHora: "asc",
      },
    });

    return {
      success: true,
      message: "Citas del usuario obtenidas correctamente",
      data: citas,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al obtener las citas del usuario",
    };
  }
}

export const cancelarCita = async (
  citaId: string  
): Promise<
  Response<
    Prisma.CitaGetPayload<{
      include: {
        trabajador: true;
        servicio: true;
      };
    }>
  > | undefined
> => {
  try {
    if (!citaId) {
      return {
        success: false,
        message: "ID de cita no proporcionado",
      };
    }

    const cita = await prisma.cita.update({
      where: { id: citaId },
      data: { estado: "CANCELADA" },
      include: {
        trabajador: true,
        servicio: true,
      },
    });

    return {
      success: true,
      message: "Cita cancelada correctamente",
      data: cita,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al cancelar la cita",
    };
  }
};


export const getBlockedDays = async (): Promise<Response<{id: string, fecha: Date, motivo: string | null}[]>> => {
  try {
    const blockedDays = await prisma.diaCerradoGlobal.findMany({
      orderBy: {
        fecha: 'asc'
      }
    });

    return {
      success: true,
      message: "Días bloqueados obtenidos correctamente",
      data: blockedDays,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al obtener los días bloqueados",
    };
  }
};


export const createBlockedDay = async (
  { fecha, motivo }: { fecha: string, motivo: string | null }
): Promise<Response<{id: string, fecha: Date, motivo: string | null}>> => {
  try {
    console.log("Received date string:", fecha);
    
 
    const [year, month, day] = fecha.split('-').map(Number);
    

    const dateOnly = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    
    console.log("Date being saved to database:", dateOnly.toISOString());
    
    const blockedDay = await prisma.diaCerradoGlobal.create({
      data: {
        fecha: dateOnly,
        motivo,
      },
    });

    return {
      success: true,
      message: "Día bloqueado correctamente",
      data: blockedDay,
    };
  } catch (error) {
    console.error(error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return {
        success: false,
        message: "Esta fecha ya está bloqueada",
      };
    }
    return {
      success: false,
      message: "Error al bloquear el día",
    };
  }
};


export const deleteBlockedDay = async (
  id: string
): Promise<Response<{id: string}>> => {
  try {
    await prisma.diaCerradoGlobal.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Bloqueo eliminado correctamente",
      data: { id },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Error al eliminar el bloqueo",
    };
  }
};