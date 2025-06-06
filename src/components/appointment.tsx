"use client";

import {
  createCita,
  getAvailableDates,
  getServicioById,
  getunavailableDates,
} from "@/actions/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  ArrowLeft,
  CalendarIcon,
  CheckCircle,
  ChevronRight,
  Clock,
  LoaderCircle,
  Star,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Trabajador {
  id: string;
  nombre: string;
  especialidad: string | null;
  avatar?: string;
}

interface Servicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracionMinutos: number;
  precio: number;
  trabajadores: Trabajador[];
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

const { data: session } = await authClient.getSession();
const usuarioActual = session?.user;

const getUnavailableDates = async (trabajadorId: string): Promise<string[]> => {
  const undates = await getunavailableDates(trabajadorId);

  if (!undates.success) {
    throw new Error("Error al obtener fechas no disponibles");
  }

  return undates.data || [];
};

const getAvailableSlots = async (
  trabajadorId: string,
  date: Date,
  duracionMinutos: number
): Promise<string[]> => {
  const formattedDate = format(date, "yyyy-MM-dd");
  const response = await getAvailableDates(
    formattedDate,
    trabajadorId,
    duracionMinutos
  );
  if (!response.success) {
    throw new Error("Error al obtener horarios disponibles");
  }
  return response.data?.availableTimes.map((slot) => slot) ?? [];
};

const createAppointment = async (data: {
  servicioId: string;
  trabajadorId: string;
  clienteId: string;
  fechahora: string;
}) => {
  const response = await createCita(data);
  if (!response?.success) {
    throw new Error("Error al crear la cita");
  }

  console.log("Creando cita:", data);
  return { success: true, id: "cita-123" };
};

interface BookAppointmentPageProps {
  id: string;
}

export default function BookAppointmentPage({ id }: BookAppointmentPageProps) {
  const servicioId = id;
  console.log("Servicio ID:", servicioId);
  const { data: servicio } = useQuery({
    queryKey: ["servicio", servicioId],
    queryFn: async () => {
      const response = await getServicioById(servicioId);
      if (!response?.success) {
        throw new Error("Error al obtener el servicio");
      }
      return response?.data;
    },
    refetchOnWindowFocus: false,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTrabajador, setSelectedTrabajador] =
    useState<Trabajador | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  console.log(selectedTime);
  console.log(selectedDate);
  console.log("unadates", unavailableDates);
  useEffect(() => {
    if (selectedTrabajador) {
      setIsLoading(true);
      setError(null);

      getUnavailableDates(selectedTrabajador.id)
        .then((dates) => {
          setUnavailableDates(dates);
          setIsLoading(false);
        })
        .catch((err) => {
          setError("Error al cargar fechas disponibles");
          setIsLoading(false);
        });
    }
  }, [selectedTrabajador]);

  useEffect(() => {
    if (selectedDate && selectedTrabajador) {
      setIsLoading(true);
      setSelectedTime("");

      getAvailableSlots(
        selectedTrabajador.id,
        selectedDate,
        servicio?.duracionMinutos || 0
      )
        .then((slots) => {
          setAvailableSlots(slots);
          setIsLoading(false);
        })
        .catch((err) => {
          setError("Error al cargar horarios disponibles");
          setIsLoading(false);
        });
    }
  }, [selectedDate, selectedTrabajador, servicio?.duracionMinutos]);

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "COP",
    }).format(precio);
  };

  const formatearDuracion = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0) {
      return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
    }
    return `${mins}min`;
  };

  const isDateUnavailable = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");

    console.log(
      "Checking date:",
      formattedDate,
      "Is unavailable?",
      unavailableDates.includes(formattedDate)
    );

    return (
      unavailableDates.includes(formattedDate) ||
      date < new Date(new Date().setHours(0, 0, 0, 0))
    );
  };

  const handleTrabajadorSelect = (trabajador: Trabajador) => {
    setSelectedTrabajador(trabajador);
    setSelectedDate(undefined);
    setSelectedTime("");
    setCurrentStep(2);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime("");
    if (date) {
      setCurrentStep(3);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep(4);
  };

  const handleCreateAppointment = async () => {
    if (!selectedTrabajador || !selectedDate || !selectedTime) return;

    setIsLoading(true);
    setError(null);

    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const day = selectedDate.getDate();
      const [hours, minutes] = selectedTime.split(":").map(Number);

      const fechahora = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}T${selectedTime}:00-05:00`;

      console.log("Creating appointment with ISO date and time:", fechahora);

      await createAppointment({
        servicioId,
        trabajadorId: selectedTrabajador.id,
        clienteId: usuarioActual?.id || "",
        fechahora,
      });

      setSuccess(true);
    } catch (err) {
      console.error("Error creating appointment:", err);
      setError("Error al crear la cita. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!servicio) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              ¡Cita agendada!
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Servicio:</strong> {servicio.nombre}
              </p>
              <p>
                <strong>Especialista:</strong> {selectedTrabajador?.nombre}
              </p>
              <p>
                <strong>Fecha:</strong>{" "}
                {selectedDate &&
                  format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", {
                    locale: es,
                  })}
              </p>
              <p>
                <strong>Hora:</strong> {selectedTime}
              </p>
              <p>
                <strong>Duración:</strong>{" "}
                {formatearDuracion(servicio.duracionMinutos)}
              </p>
              <p>
                <strong>Precio:</strong> {formatearPrecio(servicio.precio)}
              </p>
            </div>
            <div className="space-y-2 pt-4">
              <Button onClick={() => window.history.back()} className="w-full">
                Volver al inicio
              </Button>
              <Button variant="outline" className="w-full">
                Ver mis citas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Agendar Cita
              </h1>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{servicio.nombre}</CardTitle>
                <p className="text-gray-600 mt-2">{servicio.descripcion}</p>
              </div>
              <div className="text-right space-y-2">
                <Badge
                  variant="secondary"
                  className="bg-purple-100 text-purple-700"
                >
                  {formatearPrecio(servicio.precio)}
                </Badge>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatearDuracion(servicio.duracionMinutos)}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Indicador de pasos */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <ChevronRight
                    className={`w-4 h-4 mx-2 ${
                      step < currentStep ? "text-purple-600" : "text-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <p className="text-sm text-gray-600">
              {currentStep === 1 && "Selecciona un especialista"}
              {currentStep === 2 && "Elige una fecha"}
              {currentStep === 3 && "Selecciona un horario"}
              {currentStep === 4 && "Confirma tu cita"}
            </p>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {currentStep >= 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Selecciona un especialista</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {servicio.trabajadores.map((trabajador) => (
                  <div
                    key={trabajador.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTrabajador?.id === trabajador.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                    }`}
                    onClick={() => handleTrabajadorSelect(trabajador)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage
                          src={trabajador.nombre || "/placeholder.svg"}
                          alt={trabajador.nombre}
                        />
                        <AvatarFallback>
                          {trabajador.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{trabajador.nombre}</h3>
                        {trabajador.especialidad && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            {trabajador.especialidad}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep >= 2 && selectedTrabajador && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5" />
                <span>Selecciona una fecha</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && currentStep === 2 ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={isDateUnavailable}
                    locale={es}
                    className="rounded-md border"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep >= 3 && selectedDate && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Selecciona un horario</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && currentStep === 3 ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedTime === slot ? "default" : "outline"}
                      onClick={() => handleTimeSelect(slot)}
                      className={`${
                        selectedTime === slot
                          ? "bg-purple-600 hover:bg-purple-700"
                          : ""
                      }`}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep >= 4 && selectedTime && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Confirma tu cita</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Servicio:</span>
                  <span>{servicio.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Especialista:</span>
                  <span>{selectedTrabajador?.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Fecha:</span>
                  <span>
                    {selectedDate &&
                      format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", {
                        locale: es,
                      })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Hora:</span>
                  <span>{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Duración:</span>
                  <span>{formatearDuracion(servicio.duracionMinutos)}</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="font-medium">Precio total:</span>
                  <span className="font-bold text-lg">
                    {formatearPrecio(servicio.precio)}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleCreateAppointment}
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Agendando cita...</span>
                  </div>
                ) : (
                  "Confirmar y agendar cita"
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
