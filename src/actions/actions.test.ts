import { prismaMock } from "@/lib/prisma-mock";
import { EstadoCita } from "@prisma/client";
import {
  createBlockedDay,
  createCita,
  getAvailableDates,
  getunavailableDates,
} from "./actions";

// Mock the prisma instance used in actions.ts
jest.mock("../lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("Appointment Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getunavailableDates", () => {
    it("should return unavailable dates for a worker", async () => {
      // Arrange
      const trabajadorId = "worker-123";
      const mockWorkerClosedDates = [
        {
          id: "id1",
          fecha: new Date("2023-06-15T12:00:00Z"),
          trabajadorId: trabajadorId,
          motivo: "Vacation",
        },
      ];
      const mockGlobalClosedDates = [
        {
          id: "id-2",
          fecha: new Date("2023-06-20T12:00:00Z"),
          motivo: "Holiday",
        },
      ];

      prismaMock.diaCerradoTrabajador.findMany.mockResolvedValue(
        mockWorkerClosedDates
      );
      prismaMock.diaCerradoGlobal.findMany.mockResolvedValue(
        mockGlobalClosedDates
      );

      // Act
      const result = await getunavailableDates(trabajadorId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data).toContain("2023-06-15");
      expect(result.data).toContain("2023-06-20");
      expect(prismaMock.diaCerradoTrabajador.findMany).toHaveBeenCalledWith({
        where: { trabajadorId },
        select: { fecha: true },
      });
    });

    it("should handle errors and return error response", async () => {
      // Arrange
      const trabajadorId = "worker-123";
      prismaMock.diaCerradoTrabajador.findMany.mockRejectedValue(
        new Error("DB Error")
      );

      // Act
      const result = await getunavailableDates(trabajadorId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain(
        "Error al obtener las fechas no disponibles"
      );
    });
  });

  describe("getAvailableDates", () => {
    it("should return available times for a date", async () => {
      const date = "2023-06-16";
      const trabajadorId = "worker-123";
      const duracionMinutos = 30;

      prismaMock.diaCerradoGlobal.findFirst.mockResolvedValue(null);
      prismaMock.diaCerradoTrabajador.findFirst.mockResolvedValue(null);
      prismaMock.diaEspecial.findFirst.mockResolvedValue(null);

      prismaMock.cita.findMany.mockResolvedValue([
        {
          id: "cita-1",
          fechaHora: new Date("2025-11-20T14:00:00.000Z"), // 2 PM UTC, que son las 9 AM en Colombia          servicioId: 'service-1',
          trabajadorId: trabajadorId,
          clienteId: "client-1",
          estado: EstadoCita.CONFIRMADA,
          creadoEn: new Date(),
          // Include servicio as it would be returned with include
          servicio: {
            id: "service-1",
            nombre: "Test Service",
            duracionMinutos: 60,
            precio: 100,
            descripcion: "Test description",
          },
        } as any, // Use type assertion for test purposes
      ]);

      // Act
      const result = await getAvailableDates(
        date,
        trabajadorId,
        duracionMinutos
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.isClosed).toBe(false);
      expect(result.data?.availableTimes).not.toContain("09:00");
      expect(result.data?.availableTimes).not.toContain("09:30");
    });

    it("should return closed day when globally closed", async () => {
      // Arrange
      const date = "2023-06-15";
      const trabajadorId = "worker-123";

      prismaMock.diaCerradoGlobal.findFirst.mockResolvedValue({
        id: "closed-1",
        fecha: new Date(date),
        motivo: "Holiday",
      });

      // Act
      const result = await getAvailableDates(date, trabajadorId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.data?.isClosed).toBe(true);
      expect(result.data?.availableTimes).toHaveLength(0);
    });

    it("should return closed day when closed for worker", async () => {
      // Arrange
      const date = "2023-06-15";
      const trabajadorId = "worker-123";

      prismaMock.diaCerradoGlobal.findFirst.mockResolvedValue(null);
      prismaMock.diaCerradoTrabajador.findFirst.mockResolvedValue({
        id: "worker-closed-1",
        trabajadorId,
        fecha: new Date(date),
        motivo: "Vacation",
      });

      // Act
      const result = await getAvailableDates(date, trabajadorId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.data?.isClosed).toBe(true);
      expect(result.data?.availableTimes).toHaveLength(0);
    });

    it("should handle errors and return error response", async () => {
      // Arrange
      const date = "2023-06-16";
      const trabajadorId = "worker-123";
      prismaMock.diaCerradoGlobal.findFirst.mockRejectedValue(
        new Error("DB Error")
      );

      // Act
      const result = await getAvailableDates(date, trabajadorId);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("createCita", () => {
    it("should create appointment successfully", async () => {
      // Arrange
      const nuevaCita = {
        servicioId: "service-123",
        trabajadorId: "worker-123",
        clienteId: "client-123",
        fechahora: "2023-06-16T10:00:00-05:00",
      };

      const mockCreatedCita = {
        id: "cita-new",
        fechaHora: new Date(nuevaCita.fechahora),
        servicioId: nuevaCita.servicioId,
        trabajadorId: nuevaCita.trabajadorId,
        clienteId: nuevaCita.clienteId,
        creadoEn: new Date(),
        estado: EstadoCita.PENDIENTE,
      };

      prismaMock.cita.create.mockResolvedValue(mockCreatedCita);

      // Act
      const result = await createCita(nuevaCita);

      // Assert
      expect(result?.success).toBe(true);
      expect(result?.data?.id).toBe("cita-new");
      expect(prismaMock.cita.create).toHaveBeenCalledWith({
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
    });

    it("should handle errors and return error response", async () => {
      // Arrange
      const nuevaCita = {
        servicioId: "service-123",
        trabajadorId: "worker-123",
        clienteId: "client-123",
        fechahora: "2023-06-16T10:00:00-05:00",
      };

      prismaMock.cita.create.mockRejectedValue(new Error("DB Error"));

      // Act
      const result = await createCita(nuevaCita);

      // Assert
      expect(result?.success).toBe(false);
      expect(result?.message).toContain("Error al crear la cita");
    });
  });

  describe("createBlockedDay", () => {
    it("should create blocked day successfully", async () => {
      // Arrange
      const blockedDayData = {
        fecha: "2023-06-18",
        motivo: "Holiday",
      };

      const mockCreatedBlockedDay = {
        id: "blocked-1",
        fecha: new Date("2023-06-18T12:00:00Z"),
        motivo: "Holiday",
      };

      prismaMock.diaCerradoGlobal.create.mockResolvedValue(
        mockCreatedBlockedDay
      );

      // Act
      const result = await createBlockedDay(blockedDayData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe("blocked-1");
      expect(result.data?.motivo).toBe("Holiday");
    });

    it("should handle unique constraint violation", async () => {
      // Arrange
      const blockedDayData = {
        fecha: "2023-06-18",
        motivo: "Holiday",
      };

      const mockError = new Error("Unique constraint violation") as any;
      mockError.code = "P2002";
      prismaMock.diaCerradoGlobal.create.mockRejectedValue(mockError);

      // Act
      const result = await createBlockedDay(blockedDayData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain("Error al bloquear el día");
    });
  });
});
