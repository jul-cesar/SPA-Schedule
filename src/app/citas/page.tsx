"use client";

import { cancelarCita, getCurrentUserCitas } from "@/actions/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { Prisma } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isPast, isToday } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCircle,
  Clock,
  Scissors,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const { data: session } = await authClient.getSession();
const usuarioActual = session?.user;

export default function UserAppointmentsPage() {
  const [activeTab, setActiveTab] = useState<string>("proximas");
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    citaId: string | null;
  }>({
    open: false,
    citaId: null,
  });
  const queryClient = useQueryClient();

  const {
    data: citas,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["citasUser"],
    queryFn: async () => {
      const response = await getCurrentUserCitas(usuarioActual?.id || "");
      if (!response?.success) {
        throw new Error("Error al obtener las citas del usuario");
      }
      return response.data;
    },
    enabled: !!usuarioActual?.id,
  });

  const cancelarCitaMutation = useMutation({
    mutationFn: async (citaId: string) => {
      const response = await cancelarCita(citaId);
      if (!response?.success) {
        throw new Error("Error al cancelar la cita");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citasUser"] });
      setCancelDialog({ open: false, citaId: null });
    },
  });

  // Filtrar citas según la pestaña activa
  const filtrarCitas = (
    citas: Prisma.CitaGetPayload<{
      include: {
        servicio: true;
        trabajador: true;
      };
    }>[] = []
  ) => {
    switch (activeTab) {
      case "proximas":
        return citas.filter((cita) => {
          const fecha = new Date(cita.fechaHora);
          return (
            (isToday(fecha) || !isPast(fecha)) && cita.estado === "PENDIENTE"
          );
        });
      case "pasadas":
        return citas.filter((cita) => {
          const fecha = new Date(cita.fechaHora);
          return (
            isPast(fecha) && !isToday(fecha) && cita.estado === "COMPLETADA"
          );
        });
      case "canceladas":
        return citas.filter((cita) => cita.estado === "CANCELADA");
      default:
        return citas;
    }
  };

  const citasFiltradas = filtrarCitas(citas);

  const formatearFechaHora = (fechahora: Date) => {
    const fecha = fechahora;
    return {
      fecha: format(fecha, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }),
      hora: format(fecha, "HH:mm"),
      esPasada: isPast(fecha) && !isToday(fecha),
      esHoy: isToday(fecha),
    };
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
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

  const getEstadoBadge = (estado: string, fechahora: Date) => {
    const { esPasada, esHoy } = formatearFechaHora(fechahora);

    switch (estado) {
      case "PENDIENTE":
        if (esHoy) {
          return (
            <Badge
              variant="outline"
              className="bg-yellow-100 text-yellow-700 border-yellow-200"
            >
              <CalendarClock className="w-3 h-3 mr-1" />
              Hoy
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-700 border-blue-200"
          >
            <CalendarCheck className="w-3 h-3 mr-1" />
            Programada
          </Badge>
        );
      case "COMPLETADA":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-700 border-green-200"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Completada
          </Badge>
        );
      case "CANCELADA":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-700 border-red-200"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleCancelarCita = (citaId: string) => {
    setCancelDialog({ open: true, citaId });
  };

  const confirmarCancelacion = () => {
    if (cancelDialog.citaId) {
      cancelarCitaMutation.mutate(cancelDialog.citaId);
    }
  };

  const citasAMostrar = citas && filtrarCitas(citas);
  if (isLoading || !citasAMostrar) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Cargando citas...
          </h2>
          <p className="text-gray-600 mb-6">Por favor, espera un momento</p>
        </div>
      </div>
    );
  }

  if (citasAMostrar?.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No tienes citas programadas
          </h2>
          <p className="text-gray-600 mb-6">
            Agenda una cita para disfrutar de nuestros servicios
          </p>
          <Button>Agendar una cita</Button>
        </div>
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
              <Link href="/">
                <ArrowLeft />
              </Link>

              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Mis Citas
              </h1>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Hola, {usuarioActual?.name || "Usuario"}
          </h2>
          <p className="text-gray-600">
            Aquí puedes ver y gestionar todas tus citas
          </p>
        </div>

        <Tabs
          defaultValue="proximas"
          className="space-y-6"
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-3 lg:w-[400px]">
            <TabsTrigger
              value="proximas"
              className="flex items-center space-x-2"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Próximas</span>
            </TabsTrigger>
            <TabsTrigger
              value="pasadas"
              className="flex items-center space-x-2"
            >
              <CalendarClock className="w-4 h-4" />
              <span>Pasadas</span>
            </TabsTrigger>
            <TabsTrigger
              value="canceladas"
              className="flex items-center space-x-2"
            >
              <CalendarX className="w-4 h-4" />
              <span>Canceladas</span>
            </TabsTrigger>
          </TabsList>

          {/* Contenido de las tabs */}
          <TabsContent value="proximas" className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Citas programadas
            </h3>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : citasAMostrar?.length > 0 ? (
              <div className="space-y-4">
                {citasAMostrar?.map((cita) => {
                  const { fecha, hora, esHoy } = formatearFechaHora(
                    cita.fechaHora
                  );
                  return (
                    <Card key={cita.id} className="overflow-hidden">
                      <div
                        className={`h-1 ${
                          esHoy
                            ? "bg-yellow-400"
                            : "bg-gradient-to-r from-purple-600 to-pink-600"
                        }`}
                      ></div>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="bg-purple-100 p-2 rounded-lg">
                                <Scissors className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {cita.servicio.nombre}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {cita.servicio.descripcion}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{fecha}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{hora}</span>
                              </div>
                              <div className="flex items-center">
                                <User className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{cita.trabajador.nombre}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {getEstadoBadge(cita.estado, cita.fechaHora)}
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-gray-700 border-gray-200"
                              >
                                {formatearDuracion(
                                  cita.servicio.duracionMinutos
                                )}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-100"
                              >
                                {formatearPrecio(cita.servicio.precio)}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleCancelarCita(cita.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-gray-50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarClock className="w-12 h-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes citas programadas
                  </h4>
                  <p className="text-gray-600 text-center mb-6">
                    Agenda una cita para disfrutar de nuestros servicios
                  </p>
                  <Button>Agendar una cita</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pasadas" className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Historial de citas
            </h3>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : citasAMostrar?.length > 0 ? (
              <div className="space-y-4">
                {citasAMostrar?.map((cita) => {
                  const { fecha, hora } = formatearFechaHora(cita.fechaHora);
                  return (
                    <Card key={cita.id} className="overflow-hidden">
                      <div className="h-1 bg-green-500"></div>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <Scissors className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {cita.servicio.nombre}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {cita.servicio.descripcion}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{fecha}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{hora}</span>
                              </div>
                              <div className="flex items-center">
                                <User className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{cita.trabajador.nombre}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {getEstadoBadge(cita.estado, cita.fechaHora)}
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-gray-700 border-gray-200"
                              >
                                {formatearDuracion(
                                  cita.servicio.duracionMinutos
                                )}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-100"
                              >
                                {formatearPrecio(cita.servicio.precio)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-gray-50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarCheck className="w-12 h-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes citas pasadas
                  </h4>
                  <p className="text-gray-600 text-center">
                    Tu historial de citas aparecerá aquí
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="canceladas" className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Citas canceladas
            </h3>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : citasAMostrar?.length > 0 ? (
              <div className="space-y-4">
                {citasAMostrar?.map((cita) => {
                  const { fecha, hora } = formatearFechaHora(cita.fechaHora);
                  return (
                    <Card key={cita.id} className="overflow-hidden">
                      <div className="h-1 bg-red-500"></div>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="bg-red-100 p-2 rounded-lg">
                                <Scissors className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {cita.servicio.nombre}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {cita.servicio.descripcion}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{fecha}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{hora}</span>
                              </div>
                              <div className="flex items-center">
                                <User className="w-4 h-4 text-gray-500 mr-2" />
                                <span>{cita.trabajador.nombre}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {getEstadoBadge(cita.estado, cita.fechaHora)}
                              <Badge
                                variant="outline"
                                className="bg-gray-100 text-gray-700 border-gray-200"
                              >
                                {formatearDuracion(
                                  cita.servicio.duracionMinutos
                                )}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-100"
                              >
                                {formatearPrecio(cita.servicio.precio)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-gray-50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarX className="w-12 h-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes citas canceladas
                  </h4>
                  <p className="text-gray-600 text-center">
                    ¡Genial! No has cancelado ninguna cita
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ open, citaId: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar cita</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, citaId: null })}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarCancelacion}
              disabled={cancelarCitaMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelarCitaMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Cancelando...</span>
                </div>
              ) : (
                "Sí, cancelar cita"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
