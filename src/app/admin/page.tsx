"use client";

import {
  createBlockedDay,
  createservicio,
  createTrabajador,
  deleteBlockedDay,
  getBlockedDays,
  getCitas,
  getServicios,
  getTrabajadores,
  updateCitaStatus,
  updateServicio,
  updateTrabajador,
} from "@/actions/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { Prisma } from "@prisma/client";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarIcon,
  CalendarX,
  Clock,
  DollarSign,
  Edit,
  LoaderCircle,
  Plus,
  Star,
  Trash,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FormErrors {
  [key: string]: string;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

const { data: session } = await authClient.getSession();
const usuarioActual = session?.user;

const TableSkeleton = () => (
  <div className="w-full animate-pulse">
    <div className="h-10 bg-gray-200 rounded-md mb-4 w-1/4"></div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 rounded-md w-full"></div>
      ))}
    </div>
  </div>
);

const EmptyState = ({
  type,
  onAddNew,
}: {
  type: string;
  onAddNew: () => void;
}) => (
  <div className="text-center py-10 border-2 border-dashed rounded-lg">
    <h3 className="text-lg font-medium mb-2">No hay {type} registrados</h3>
    <p className="text-gray-500 mb-4">Agrega uno nuevo para empezar</p>
    <Button onClick={onAddNew}>
      <Plus className="w-4 h-4 mr-2" />
      Agregar {type}
    </Button>
  </div>
);

function AdminPageContent() {
  const queryClient = useQueryClient();

  const { data: trabajadores, isLoading: loadingTrabajadores } = useQuery({
    queryKey: ["trabajadores"],
    queryFn: async () => {
      const response = await getTrabajadores();
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data || [];
    },
  });

  const { data: servicios, isLoading: loadingServicios } = useQuery({
    queryKey: ["servicios"],
    queryFn: async () => {
      const response = await getServicios();
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data || [];
    },
  });

  const { data: citas, isLoading: loadingCitas } = useQuery({
    queryKey: ["citas"],
    queryFn: async () => {
      const response = await getCitas();
      if (!response?.success) {
        throw new Error(response?.message);
      }
      return response.data || [];
    },
  });

  const { data: blockedDaysData, isLoading: loadingBlockedDays } = useQuery({
    queryKey: ["blockedDays"],
    queryFn: async () => {
      const response = await getBlockedDays();
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data || [];
    },
  });

  const createTrabajadorMutation = useMutation({
    mutationFn: createTrabajador,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trabajadores"] });
      toast.success("Trabajador creado exitosamente");
      setDialogOpen((prev) => ({ ...prev, trabajador: false }));
      resetTrabajadorForm();
    },
    onError: (error: any) => {
      toast.error("Error al crear el trabajador: " + error.message);
    },
  });

  const updateTrabajadorMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateTrabajador(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trabajadores"] });
      toast.success("Trabajador actualizado exitosamente");
      setEditDialogOpen((prev) => ({ ...prev, trabajador: false }));
      resetTrabajadorForm();
    },
    onError: (error: any) => {
      toast.error("Error al actualizar el trabajador: " + error.message);
    },
  });

  const createServicioMutation = useMutation({
    mutationFn: createservicio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast.success("Servicio creado exitosamente");
      setDialogOpen((prev) => ({ ...prev, servicio: false }));
      resetServicioForm();
    },
    onError: (error: any) => {
      toast.error("Error al crear el servicio: " + error.message);
    },
  });

  const updateServicioMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateServicio(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] });
      toast.success("Servicio actualizado exitosamente");
      setEditDialogOpen((prev) => ({ ...prev, servicio: false }));
      resetServicioForm();
    },
    onError: (error: any) => {
      toast.error("Error al actualizar el servicio: " + error.message);
    },
  });

  const updateCitaMutation = useMutation({
    mutationFn: ({
      id,
      estado,
    }: {
      id: string;
      estado: Prisma.CitaUpdateInput["estado"];
    }) => updateCitaStatus(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["citas"] });
      toast.success("Estado de cita actualizado");
      setDialogOpen((prev) => ({ ...prev, cita: false }));
    },
    onError: (error: any) => {
      toast.error("Error al actualizar la cita: " + error.message);
    },
  });

  const createBlockedDayMutation = useMutation({
    mutationFn: createBlockedDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedDays"] });
      toast.success("Día bloqueado correctamente");
      setBlockedDayDate(undefined);
      setBlockedDayMotivo("");
    },
    onError: (error: any) => {
      toast.error("Error al bloquear el día: " + error.message);
    },
  });

  const deleteBlockedDayMutation = useMutation({
    mutationFn: deleteBlockedDay,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedDays"] });
      toast.success("Bloqueo eliminado correctamente");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar el bloqueo: " + error.message);
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const [trabajadorForm, setTrabajadorForm] = useState({
    nombre: "",
    especialidad: "",
    serviciosSeleccionados: [] as string[],
  });

  const [servicioForm, setServicioForm] = useState({
    nombre: "",
    descripcion: "",
    duracionMinutos: "",
    precio: "",
    trabajadoresSeleccionados: [] as string[],
  });

  const [dialogOpen, setDialogOpen] = useState({
    trabajador: false,
    servicio: false,
    cita: false,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEstadoCita, setNewEstadoCita] =
    useState<Prisma.CitaUpdateInput["estado"]>("CANCELADA");

  const [editDialogOpen, setEditDialogOpen] = useState({
    trabajador: false,
    servicio: false,
  });

  const [activeTab, setActiveTab] = useState("trabajadores");

  const [blockedDayDate, setBlockedDayDate] = useState<Date | undefined>(
    undefined
  );
  const [blockedDayMotivo, setBlockedDayMotivo] = useState("");
  const [blockedDays, setBlockedDays] = useState<
    Array<{ id: string; fecha: Date; motivo: string | null }>
  >([]);
  const [isLoadingBlockedDays, setIsLoadingBlockedDays] = useState(false);

  const resetTrabajadorForm = () => {
    setTrabajadorForm({
      nombre: "",
      especialidad: "",
      serviciosSeleccionados: [],
    });
    setErrors({});
  };

  const resetServicioForm = () => {
    setServicioForm({
      nombre: "",
      descripcion: "",
      duracionMinutos: "",
      precio: "",
      trabajadoresSeleccionados: [],
    });
    setErrors({});
  };

  const validateTrabajadorForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!trabajadorForm.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    } else if (trabajadorForm.nombre.trim().length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
    }

    return newErrors;
  };

  const validateServicioForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!servicioForm.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (
      !servicioForm.duracionMinutos ||
      Number.parseInt(servicioForm.duracionMinutos) <= 0
    ) {
      newErrors.duracionMinutos = "La duración debe ser mayor a 0";
    }

    if (!servicioForm.precio || Number.parseFloat(servicioForm.precio) <= 0) {
      newErrors.precio = "El precio debe ser mayor a 0";
    }

    return newErrors;
  };

  const handleCreateTrabajador = async () => {
    setErrors({});
    const validationErrors = validateTrabajadorForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const nuevoTrabajador = {
      nombre: trabajadorForm.nombre,
      especialidad: trabajadorForm.especialidad || null,
      serviciosIds: trabajadorForm.serviciosSeleccionados,
    };

    createTrabajadorMutation.mutate(nuevoTrabajador);
  };

  const handleCreateServicio = async () => {
    setErrors({});
    const validationErrors = validateServicioForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const nuevoServicio = {
      nombre: servicioForm.nombre,
      descripcion: servicioForm.descripcion || null,
      duracionMinutos: Number.parseInt(servicioForm.duracionMinutos),
      precio: Number.parseFloat(servicioForm.precio),
      trabajadoresIds: servicioForm.trabajadoresSeleccionados,
    };

    createServicioMutation.mutate(nuevoServicio);
  };

  const handleDeleteTrabajador = (id: string) => {
    toast.success("Trabajador eliminado exitosamente");
  };

  const handleDeleteServicio = (id: string) => {
    toast.success("Servicio eliminado exitosamente");
  };

  const handleEditTrabajador = (trabajadorId: string) => {
    const trabajadorToEdit = trabajadores?.find((t) => t.id === trabajadorId);
    if (!trabajadorToEdit) return;

    setEditingId(trabajadorId);
    setTrabajadorForm({
      nombre: trabajadorToEdit.nombre,
      especialidad: trabajadorToEdit.especialidad || "",
      serviciosSeleccionados: trabajadorToEdit.servicios.map((s) => s.id),
    });
    setEditDialogOpen((prev) => ({ ...prev, trabajador: true }));
  };

  const handleEditServicio = (servicioId: string) => {
    const servicioToEdit = servicios?.find((s) => s.id === servicioId);
    if (!servicioToEdit) return;

    setEditingId(servicioId);
    setServicioForm({
      nombre: servicioToEdit.nombre,
      descripcion: servicioToEdit.descripcion || "",
      duracionMinutos: servicioToEdit.duracionMinutos.toString(),
      precio: servicioToEdit.precio.toString(),
      trabajadoresSeleccionados: servicioToEdit.trabajadores.map((t) => t.id),
    });
    setEditDialogOpen((prev) => ({ ...prev, servicio: true }));
  };

  const handleEditCita = (citaId: string) => {
    const citaToEdit = citas?.find((c) => c.id === citaId);
    if (!citaToEdit) return;

    setEditingId(citaId);
    setNewEstadoCita(citaToEdit.estado);
    setDialogOpen((prev) => ({
      ...prev,
      cita: true,
    }));
  };

  const handleUpdateCita = async () => {
    if (!editingId || !newEstadoCita) {
      toast.error("ID de cita o nuevo estado no encontrado");
      return;
    }

    updateCitaMutation.mutate({ id: editingId, estado: newEstadoCita });
  };

  const handleUpdateTrabajador = async () => {
    setErrors({});
    const validationErrors = validateTrabajadorForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!editingId) {
      toast.error("ID del trabajador no encontrado");
      return;
    }

    const datosActualizados = {
      nombre: trabajadorForm.nombre,
      especialidad: trabajadorForm.especialidad || null,
      serviciosIds: trabajadorForm.serviciosSeleccionados,
    };

    updateTrabajadorMutation.mutate({ id: editingId, data: datosActualizados });
  };

  const handleUpdateServicio = async () => {
    setErrors({});
    const validationErrors = validateServicioForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!editingId) {
      toast.error("ID del servicio no encontrado");
      return;
    }

    const datosActualizados = {
      nombre: servicioForm.nombre,
      descripcion: servicioForm.descripcion || null,
      duracionMinutos: Number.parseInt(servicioForm.duracionMinutos),
      precio: Number.parseFloat(servicioForm.precio),
      trabajadoresIds: servicioForm.trabajadoresSeleccionados,
    };

    updateServicioMutation.mutate({ id: editingId, data: datosActualizados });
  };

  // Function to handle blocked day creation
  const handleCreateBlockedDay = () => {
    if (!blockedDayDate) {
      toast.error("Debes seleccionar una fecha");
      return;
    }

    // Fix the date timezone issue by using UTC date with time set to noon
    // This ensures the date doesn't shift when converting between timezones
    const utcDate = new Date(
      Date.UTC(
        blockedDayDate.getFullYear(),
        blockedDayDate.getMonth(),
        blockedDayDate.getDate(),
        12,
        0,
        0
      )
    );

    const formattedDate = format(utcDate, "yyyy-MM-dd");
    console.log("Selected date:", blockedDayDate);
    console.log("Formatted date to be sent:", formattedDate);

    createBlockedDayMutation.mutate({
      fecha: formattedDate,
      motivo: blockedDayMotivo || null,
    });
  };

  // Function to properly display blocked dates accounting for timezone
  const isBlockedDay = (date: Date) => {
    if (!blockedDaysData) return false;

    // For comparison, we need to normalize both dates to remove time component
    const normalizedDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    )
      .toISOString()
      .split("T")[0];

    return blockedDaysData.some((day) => {
      const dayDate = new Date(day.fecha);
      const normalizedBlockedDate = new Date(
        Date.UTC(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate())
      )
        .toISOString()
        .split("T")[0];

      return normalizedBlockedDate === normalizedDate;
    });
  };

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

  const formatearFechaHora = (fecha: Date) => {
    return fecha.toLocaleString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isLoading =
    loadingTrabajadores ||
    loadingServicios ||
    loadingCitas ||
    loadingBlockedDays;

  const isMutating =
    createTrabajadorMutation.isPending ||
    updateTrabajadorMutation.isPending ||
    createServicioMutation.isPending ||
    updateServicioMutation.isPending ||
    updateCitaMutation.isPending ||
    createBlockedDayMutation.isPending ||
    deleteBlockedDayMutation.isPending;

  if (!usuarioActual) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="w-8 h-8 animate-spin text-gray-500" />
        <p className="ml-2">Verificando sesión...</p>
      </div>
    );
  }

  if (!servicios || !trabajadores || !citas) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="w-8 h-8 animate-spin text-gray-500" />
        <p className="ml-2">Cargando datos...</p>
      </div>
    );
  }

  if (usuarioActual?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Acceso restringido</h2>
        <p className="text-gray-600 mb-6">
          Esta área es solo para administradores.
        </p>
        <Button onClick={() => (window.location.href = "/")}>
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Panel de Administración
              </h1>
            </div>
            <div className="flex items-center">
              <Badge variant="outline" className="ml-2">
                Admin: {usuarioActual.name}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="mb-6">
            <div className="flex items-center justify-center p-4 border rounded-md bg-gray-50">
              <LoaderCircle className="w-6 h-6 animate-spin text-purple-600 mr-2" />
              <span>Cargando datos...</span>
            </div>
          </div>
        )}

        <Tabs
          defaultValue="trabajadores"
          className="space-y-6"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger
              value="trabajadores"
              className="flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Trabajadores</span>
            </TabsTrigger>
            <TabsTrigger
              value="servicios"
              className="flex items-center space-x-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>Servicios</span>
            </TabsTrigger>
            <TabsTrigger value="citas" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Citas</span>
            </TabsTrigger>
            <TabsTrigger
              value="bloqueos"
              className="flex items-center space-x-2"
            >
              <CalendarX className="w-4 h-4" />
              <span>Bloqueos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trabajadores" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Gestión de Trabajadores
                </h2>
                <p className="text-gray-600">
                  Administra el equipo de trabajo y sus especialidades
                </p>
              </div>

              <Dialog
                open={dialogOpen.trabajador}
                onOpenChange={(open) => {
                  setDialogOpen((prev) => ({ ...prev, trabajador: open }));
                  if (!open) resetTrabajadorForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Trabajador
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Trabajador</DialogTitle>
                    <DialogDescription>
                      Completa la información del nuevo miembro del equipo
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre completo *</Label>
                      <Input
                        id="nombre"
                        value={trabajadorForm.nombre}
                        onChange={(e) =>
                          setTrabajadorForm((prev) => ({
                            ...prev,
                            nombre: e.target.value,
                          }))
                        }
                        placeholder="Ej: Ana García"
                        className={errors.nombre ? "border-red-300" : ""}
                      />
                      {errors.nombre && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.nombre}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="especialidad">Especialidad</Label>
                      <Input
                        id="especialidad"
                        value={trabajadorForm.especialidad}
                        onChange={(e) =>
                          setTrabajadorForm((prev) => ({
                            ...prev,
                            especialidad: e.target.value,
                          }))
                        }
                        placeholder="Ej: Coloración y Tratamientos"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Servicios que puede realizar</Label>
                      {loadingServicios ? (
                        <div className="flex justify-center p-4">
                          <LoaderCircle className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                          {servicios && servicios.length > 0 ? (
                            servicios.map((servicio) => (
                              <div
                                key={servicio.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`servicio-${servicio.id}`}
                                  checked={trabajadorForm.serviciosSeleccionados.includes(
                                    servicio.id
                                  )}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setTrabajadorForm((prev) => ({
                                        ...prev,
                                        serviciosSeleccionados: [
                                          ...prev.serviciosSeleccionados,
                                          servicio.id,
                                        ],
                                      }));
                                    } else {
                                      setTrabajadorForm((prev) => ({
                                        ...prev,
                                        serviciosSeleccionados:
                                          prev.serviciosSeleccionados.filter(
                                            (id) => id !== servicio.id
                                          ),
                                      }));
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`servicio-${servicio.id}`}
                                  className="text-sm"
                                >
                                  {servicio.nombre}
                                </Label>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-2 text-gray-500">
                              No hay servicios disponibles
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setDialogOpen((prev) => ({
                          ...prev,
                          trabajador: false,
                        }))
                      }
                      disabled={createTrabajadorMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateTrabajador}
                      disabled={createTrabajadorMutation.isPending}
                      className="relative"
                    >
                      {createTrabajadorMutation.isPending && (
                        <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Crear Trabajador
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Dialog
              open={editDialogOpen.trabajador}
              onOpenChange={(open) => {
                setEditDialogOpen((prev) => ({ ...prev, trabajador: open }));
                if (!open) setEditingId(null);
              }}
            >
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Editar Trabajador</DialogTitle>
                  <DialogDescription>
                    Modifica la información del trabajador
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nombre">Nombre completo *</Label>
                    <Input
                      id="edit-nombre"
                      value={trabajadorForm.nombre}
                      onChange={(e) =>
                        setTrabajadorForm((prev) => ({
                          ...prev,
                          nombre: e.target.value,
                        }))
                      }
                      placeholder="Ej: Ana García"
                      className={errors.nombre ? "border-red-300" : ""}
                    />
                    {errors.nombre && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.nombre}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-especialidad">Especialidad</Label>
                    <Input
                      id="edit-especialidad"
                      value={trabajadorForm.especialidad}
                      onChange={(e) =>
                        setTrabajadorForm((prev) => ({
                          ...prev,
                          especialidad: e.target.value,
                        }))
                      }
                      placeholder="Ej: Coloración y Tratamientos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Servicios que puede realizar</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                      {servicios.map((servicio) => (
                        <div
                          key={servicio.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`edit-servicio-${servicio.id}`}
                            checked={trabajadorForm.serviciosSeleccionados.includes(
                              servicio.id
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTrabajadorForm((prev) => ({
                                  ...prev,
                                  serviciosSeleccionados: [
                                    ...prev.serviciosSeleccionados,
                                    servicio.id,
                                  ],
                                }));
                              } else {
                                setTrabajadorForm((prev) => ({
                                  ...prev,
                                  serviciosSeleccionados:
                                    prev.serviciosSeleccionados.filter(
                                      (id) => id !== servicio.id
                                    ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`edit-servicio-${servicio.id}`}
                            className="text-sm"
                          >
                            {servicio.nombre}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setEditDialogOpen((prev) => ({
                        ...prev,
                        trabajador: false,
                      }))
                    }
                    disabled={updateTrabajadorMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdateTrabajador}
                    disabled={updateTrabajadorMutation.isPending}
                    className="relative"
                  >
                    {updateTrabajadorMutation.isPending && (
                      <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Actualizar Trabajador
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>
                    Trabajadores Registrados ({trabajadores?.length || 0})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTrabajadores ? (
                  <TableSkeleton />
                ) : trabajadores && trabajadores.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trabajador</TableHead>
                        <TableHead>Especialidad</TableHead>
                        <TableHead>Servicios</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trabajadores.map((trabajador) => (
                        <TableRow key={trabajador.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src="/placeholder.svg" />
                                <AvatarFallback>
                                  {trabajador.nombre
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {trabajador.nombre}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {trabajador.especialidad ? (
                              <Badge
                                variant="secondary"
                                className="bg-purple-100 text-purple-700"
                              >
                                <Star className="w-3 h-3 mr-1" />
                                {trabajador.especialidad}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">
                                Sin especialidad
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {trabajador.servicios
                                .slice(0, 2)
                                .map((servicio) => (
                                  <Badge
                                    key={servicio.id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {servicio.nombre}
                                  </Badge>
                                ))}
                              {trabajador.servicios.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{trabajador.servicios.length - 2} más
                                </Badge>
                              )}
                              {trabajador.servicios.length === 0 && (
                                <span className="text-gray-400 text-sm">
                                  Sin servicios
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleEditTrabajador(trabajador.id)
                                }
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    type="trabajadores"
                    onAddNew={() =>
                      setDialogOpen((prev) => ({ ...prev, trabajador: true }))
                    }
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servicios" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Gestión de Servicios
                </h2>
                <p className="text-gray-600">
                  Administra los servicios ofrecidos y sus precios
                </p>
              </div>

              <Dialog
                open={dialogOpen.servicio}
                onOpenChange={(open) =>
                  setDialogOpen((prev) => ({ ...prev, servicio: open }))
                }
              >
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Servicio
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Servicio</DialogTitle>
                    <DialogDescription>
                      Define un nuevo servicio para ofrecer a los clientes
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre-servicio">
                        Nombre del servicio *
                      </Label>
                      <Input
                        id="nombre-servicio"
                        value={servicioForm.nombre}
                        onChange={(e) =>
                          setServicioForm((prev) => ({
                            ...prev,
                            nombre: e.target.value,
                          }))
                        }
                        placeholder="Ej: Corte de Cabello Premium"
                        className={errors.nombre ? "border-red-300" : ""}
                      />
                      {errors.nombre && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.nombre}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        value={servicioForm.descripcion}
                        onChange={(e) =>
                          setServicioForm((prev) => ({
                            ...prev,
                            descripcion: e.target.value,
                          }))
                        }
                        placeholder="Describe el servicio en detalle..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duracion">Duración (minutos) *</Label>
                        <Input
                          id="duracion"
                          type="number"
                          value={servicioForm.duracionMinutos}
                          onChange={(e) =>
                            setServicioForm((prev) => ({
                              ...prev,
                              duracionMinutos: e.target.value,
                            }))
                          }
                          placeholder="60"
                          className={
                            errors.duracionMinutos ? "border-red-300" : ""
                          }
                        />
                        {errors.duracionMinutos && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.duracionMinutos}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="precio">Precio *</Label>
                        <Input
                          id="precio"
                          type="number"
                          step="0.01"
                          value={servicioForm.precio}
                          onChange={(e) =>
                            setServicioForm((prev) => ({
                              ...prev,
                              precio: e.target.value,
                            }))
                          }
                          placeholder="25.00"
                          className={errors.precio ? "border-red-300" : ""}
                        />
                        {errors.precio && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.precio}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Trabajadores que pueden realizarlo</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                        {trabajadores.map((trabajador) => (
                          <div
                            key={trabajador.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`trabajador-${trabajador.id}`}
                              checked={servicioForm.trabajadoresSeleccionados.includes(
                                trabajador.id
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setServicioForm((prev) => ({
                                    ...prev,
                                    trabajadoresSeleccionados: [
                                      ...prev.trabajadoresSeleccionados,
                                      trabajador.id,
                                    ],
                                  }));
                                } else {
                                  setServicioForm((prev) => ({
                                    ...prev,
                                    trabajadoresSeleccionados:
                                      prev.trabajadoresSeleccionados.filter(
                                        (id) => id !== trabajador.id
                                      ),
                                  }));
                                }
                              }}
                            />
                            <Label
                              htmlFor={`trabajador-${trabajador.id}`}
                              className="text-sm"
                            >
                              {trabajador.nombre}
                              {trabajador.especialidad && (
                                <span className="text-gray-500 ml-1">
                                  ({trabajador.especialidad})
                                </span>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setDialogOpen((prev) => ({ ...prev, servicio: false }))
                      }
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateServicio} disabled={isLoading}>
                      {isLoading ? "Creando..." : "Crear Servicio"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Dialog
              open={editDialogOpen.servicio}
              onOpenChange={(open) => {
                setEditDialogOpen((prev) => ({ ...prev, servicio: open }));
                if (!open) setEditingId(null);
              }}
            >
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Editar Servicio</DialogTitle>
                  <DialogDescription>
                    Modifica la información del servicio
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nombre-servicio">
                      Nombre del servicio *
                    </Label>
                    <Input
                      id="edit-nombre-servicio"
                      value={servicioForm.nombre}
                      onChange={(e) =>
                        setServicioForm((prev) => ({
                          ...prev,
                          nombre: e.target.value,
                        }))
                      }
                      placeholder="Ej: Corte de Cabello Premium"
                      className={errors.nombre ? "border-red-300" : ""}
                    />
                    {errors.nombre && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.nombre}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-descripcion">Descripción</Label>
                    <Textarea
                      id="edit-descripcion"
                      value={servicioForm.descripcion}
                      onChange={(e) =>
                        setServicioForm((prev) => ({
                          ...prev,
                          descripcion: e.target.value,
                        }))
                      }
                      placeholder="Describe el servicio en detalle..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-duracion">
                        Duración (minutos) *
                      </Label>
                      <Input
                        id="edit-duracion"
                        type="number"
                        value={servicioForm.duracionMinutos}
                        onChange={(e) =>
                          setServicioForm((prev) => ({
                            ...prev,
                            duracionMinutos: e.target.value,
                          }))
                        }
                        placeholder="60"
                        className={
                          errors.duracionMinutos ? "border-red-300" : ""
                        }
                      />
                      {errors.duracionMinutos && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.duracionMinutos}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-precio">Precio *</Label>
                      <Input
                        id="edit-precio"
                        type="number"
                        step="0.01"
                        value={servicioForm.precio}
                        onChange={(e) =>
                          setServicioForm((prev) => ({
                            ...prev,
                            precio: e.target.value,
                          }))
                        }
                        placeholder="25.00"
                        className={errors.precio ? "border-red-300" : ""}
                      />
                      {errors.precio && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.precio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Trabajadores que pueden realizarlo</Label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                      {trabajadores.map((trabajador) => (
                        <div
                          key={trabajador.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`edit-trabajador-${trabajador.id}`}
                            checked={servicioForm.trabajadoresSeleccionados.includes(
                              trabajador.id
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setServicioForm((prev) => ({
                                  ...prev,
                                  trabajadoresSeleccionados: [
                                    ...prev.trabajadoresSeleccionados,
                                    trabajador.id,
                                  ],
                                }));
                              } else {
                                setServicioForm((prev) => ({
                                  ...prev,
                                  trabajadoresSeleccionados:
                                    prev.trabajadoresSeleccionados.filter(
                                      (id) => id !== trabajador.id
                                    ),
                                }));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`edit-trabajador-${trabajador.id}`}
                            className="text-sm"
                          >
                            {trabajador.nombre}
                            {trabajador.especialidad && (
                              <span className="text-gray-500 ml-1">
                                ({trabajador.especialidad})
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setEditDialogOpen((prev) => ({
                        ...prev,
                        servicio: false,
                      }))
                    }
                    disabled={updateServicioMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdateServicio}
                    disabled={updateServicioMutation.isPending}
                    className="relative"
                  >
                    {updateServicioMutation.isPending && (
                      <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Actualizar Servicio
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Briefcase className="w-5 h-5" />
                  <span>Servicios Disponibles ({servicios?.length || 0})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingServicios ? (
                  <TableSkeleton />
                ) : servicios && servicios.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Trabajadores</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {servicios.map((servicio) => (
                        <TableRow key={servicio.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{servicio.nombre}</p>
                              {servicio.descripcion && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {servicio.descripcion}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="flex items-center w-fit"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {formatearDuracion(servicio.duracionMinutos)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 flex items-center w-fit"
                            >
                              <DollarSign className="w-3 h-3 mr-1" />
                              {formatearPrecio(servicio.precio)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {servicio.trabajadores
                                .slice(0, 2)
                                .map((trabajador) => (
                                  <Badge
                                    key={trabajador.id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    <User className="w-3 h-3 mr-1" />
                                    {trabajador.nombre}
                                  </Badge>
                                ))}
                              {servicio.trabajadores.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{servicio.trabajadores.length - 2} más
                                </Badge>
                              )}
                              {servicio.trabajadores.length === 0 && (
                                <span className="text-gray-400 text-sm">
                                  Sin trabajadores
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditServicio(servicio.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState
                    type="servicios"
                    onAddNew={() =>
                      setDialogOpen((prev) => ({ ...prev, servicio: true }))
                    }
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="citas" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Gestión de Citas
                </h2>
                <p className="text-gray-600">
                  Administra las citas agendadas y su estado
                </p>
              </div>

              <Dialog
                open={dialogOpen.cita}
                onOpenChange={(open) =>
                  setDialogOpen((prev) => ({ ...prev, cita: open }))
                }
              >
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Editar estado cita</DialogTitle>
                    <DialogDescription>
                      Actualiza el estado de la cita seleccionada
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <Label htmlFor="estado-cita">Nuevo estado</Label>
                    <Select
                      value={newEstadoCita as string}
                      onValueChange={(value) =>
                        setNewEstadoCita(
                          value as Prisma.CitaUpdateInput["estado"]
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
                        <SelectItem value="CANCELADA">Cancelada</SelectItem>
                        <SelectItem value="COMPLETADA">Completada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setDialogOpen((prev) => ({ ...prev, cita: false }))
                      }
                      disabled={updateCitaMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleUpdateCita}
                      disabled={updateCitaMutation.isPending}
                      className="relative"
                    >
                      {updateCitaMutation.isPending && (
                        <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Actualizar Estado
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {/* Tabla de Citas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Citas Agendadas ({citas?.length || 0})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCitas ? (
                  <TableSkeleton />
                ) : citas && citas.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha y Hora</TableHead>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Trabajador</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {citas.map((cita) => (
                        <TableRow key={cita.id}>
                          <TableCell>{cita.cliente.name}</TableCell>
                          <TableCell>
                            {formatearFechaHora(cita.fechaHora)}
                          </TableCell>
                          <TableCell>{cita.servicio.nombre}</TableCell>
                          <TableCell>{cita.trabajador.nombre}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                cita.estado === "CONFIRMADA"
                                  ? "outline"
                                  : cita.estado === "COMPLETADA"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {cita.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCita(cita.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No hay citas registradas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bloqueos" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Gestión de Días Bloqueados
                </h2>
                <p className="text-gray-600">
                  Bloquea días completos en el calendario para todos los
                  trabajadores
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarX className="w-5 h-5" />
                    <span>Bloquear un Día</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <CalendarComponent
                      mode="single"
                      selected={blockedDayDate}
                      onSelect={setBlockedDayDate}
                      disabled={(date) => {
                        return (
                          isBlockedDay(date) ||
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        );
                      }}
                      locale={es}
                      className="rounded-md border"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivo">
                      Motivo del bloqueo (opcional)
                    </Label>
                    <Textarea
                      id="motivo"
                      placeholder="Ej: Día festivo, mantenimiento..."
                      value={blockedDayMotivo}
                      onChange={(e) => setBlockedDayMotivo(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleCreateBlockedDay}
                    disabled={
                      !blockedDayDate || createBlockedDayMutation.isPending
                    }
                    className="w-full"
                  >
                    {createBlockedDayMutation.isPending ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Bloqueando...
                      </>
                    ) : (
                      "Bloquear Día"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarIcon className="w-5 h-5" />
                    <span>Días Bloqueados</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingBlockedDays ? (
                    <div className="flex justify-center py-8">
                      <LoaderCircle className="animate-spin h-8 w-8 text-purple-600" />
                    </div>
                  ) : blockedDaysData && blockedDaysData.length > 0 ? (
                    <div className="space-y-4">
                      {blockedDaysData.map((day) => {
                        const displayDate = new Date(day.fecha);

                        const utcDate = new Date(
                          Date.UTC(
                            displayDate.getUTCFullYear(),
                            displayDate.getUTCMonth(),
                            displayDate.getUTCDate(),
                            12,
                            0,
                            0
                          )
                        );

                        return (
                          <div
                            key={day.id}
                            className="flex justify-between items-center p-3 border rounded-md bg-gray-50"
                          >
                            <div>
                              <p className="font-medium">
                                {format(
                                  utcDate,
                                  "EEEE, d 'de' MMMM 'de' yyyy",
                                  { locale: es }
                                )}
                              </p>
                              {day.motivo && (
                                <p className="text-sm text-gray-600">
                                  {day.motivo}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                deleteBlockedDayMutation.mutate(day.id)
                              }
                              disabled={deleteBlockedDayMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              {deleteBlockedDayMutation.isPending ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No hay días bloqueados</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Los días que bloquees aparecerán aquí
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminPageContent />
    </QueryClientProvider>
  );
}
