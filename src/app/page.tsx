"use client";

import { getServicios } from "@/actions/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronRight,
  Clock,
  FilterX,
  LoaderCircle,
  LogOut,
  Search,
  Shield,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const { data: session } = await authClient.getSession();
const usuarioActual = session?.user;

const ServiceCardSkeleton = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-lg border shadow-lg p-6 h-full">
    <div className="flex justify-between items-start mb-4">
      <Skeleton className="h-7 w-3/5" />
      <Skeleton className="h-6 w-20" />
    </div>
    <Skeleton className="h-4 w-full mb-1" />
    <Skeleton className="h-4 w-4/5 mb-6" />
    <Skeleton className="h-5 w-32 mb-4" />
    <div className="space-y-2 mb-6">
      <Skeleton className="h-5 w-40 mb-2" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </div>
    <Skeleton className="h-10 w-full" />
  </div>
);

type SortOption =
  | "price-asc"
  | "price-desc"
  | "duration-asc"
  | "duration-desc"
  | "name-asc"
  | "name-desc";

function DashboardContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const router = useRouter();

  const {
    data: servicios = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["servicios"],
    queryFn: async () => {
      const response = await getServicios();
      if (!response.success) {
        throw new Error(response.message || "Error al obtener los servicios");
      }
      return response.data;
    },
  });

  const serviciosFiltrados = useMemo(() => {
    if (!servicios) return [];

    let filtered = servicios.filter(
      (servicio) =>
        servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (servicio.descripcion &&
          servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.precio - b.precio;
        case "price-desc":
          return b.precio - a.precio;
        case "duration-asc":
          return a.duracionMinutos - b.duracionMinutos;
        case "duration-desc":
          return b.duracionMinutos - a.duracionMinutos;
        case "name-asc":
          return a.nombre.localeCompare(b.nombre);
        case "name-desc":
          return b.nombre.localeCompare(a.nombre);
        default:
          return 0;
      }
    });
  }, [servicios, searchTerm, filterCategory, sortBy]);

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

  const handleVerServicio = (servicioId: string) => {
    console.log("Ver detalles del servicio:", servicioId);
    router.push(`/agendar/${servicioId}`);
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleAdminPanel = () => {
    console.log("Accediendo al panel de administración...");
    router.push("/admin");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterCategory(null);
    setSortBy("name-asc");
  };

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
            <X className="text-red-600 w-6 h-6" />
          </div>
          <h2 className="text-2xl font-semibold text-center mb-2">
            Error al cargar servicios
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Ocurrió un problema al intentar obtener la lista de servicios. Por
            favor intenta nuevamente.
          </p>
          <Button
            onClick={() => refetch()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
            Reintentarr
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen  ">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LoaderCircle className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Cargando información...
            </h2>
            <p className="text-gray-600">
              Por favor, espera mientras se carga tu perfil y los servicios.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Beauty Salon
                </h1>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {usuarioActual?.role === "ADMIN" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAdminPanel}
                  className="flex items-center space-x-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Shield className="w-4 h-4" />
                  <span className=" sm:inline">Panel Admin</span>
                </Button>
              )}

              {usuarioActual && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2 hover:bg-gray-100"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={usuarioActual.image || "/placeholder.svg"}
                          alt={usuarioActual.name}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                          {usuarioActual.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium">
                        {usuarioActual.name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">
                        {usuarioActual.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {usuarioActual.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/citas" className="cursor-pointer">
                        <Calendar className="w-4 h-4 mr-2" />
                        Mis Citas
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido, {usuarioActual?.name?.split(" ")[0] || "Usuario"} 👋
          </h2>
          <p className="text-gray-600">
            Descubre nuestros servicios y agenda tu próxima cita
          </p>
        </motion.div>

        <motion.div
          className="mb-8 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                  <SelectItem value="price-asc">
                    Precio (menor a mayor)
                  </SelectItem>
                  <SelectItem value="price-desc">
                    Precio (mayor a menor)
                  </SelectItem>
                  <SelectItem value="duration-asc">
                    Duración (menor a mayor)
                  </SelectItem>
                  <SelectItem value="duration-desc">
                    Duración (mayor a menor)
                  </SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || filterCategory || sortBy !== "name-asc") && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearFilters}
                  className="h-12 w-12"
                  title="Limpiar filtros"
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {serviciosFiltrados.length > 0 && (
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Mostrando {serviciosFiltrados.length} servicios
                {searchTerm && ` para "${searchTerm}"`}
                {filterCategory && ` en categoría "${filterCategory}"`}
              </p>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Ordenado por:{" "}
                  {sortBy.includes("price")
                    ? `Precio ${sortBy === "price-asc" ? "↑" : "↓"}`
                    : sortBy.includes("duration")
                    ? `Duración ${sortBy === "duration-asc" ? "↑" : "↓"}`
                    : `Nombre ${sortBy === "name-asc" ? "A-Z" : "Z-A"}`}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? // Skeleton loading state
              Array(6)
                .fill(0)
                .map((_, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <ServiceCardSkeleton />
                  </motion.div>
                ))
            : serviciosFiltrados.map((servicio, index) => (
                <motion.div
                  key={servicio.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm h-full flex flex-col">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                          {servicio.nombre}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-700 hover:bg-purple-200"
                        >
                          {formatearPrecio(servicio.precio)}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-600 text-sm leading-relaxed">
                        {servicio.descripcion || "Sin descripción disponible"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 flex-grow flex flex-col">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span>
                          {formatearDuracion(servicio.duracionMinutos)}
                        </span>
                      </div>

                      <div className="space-y-2 flex-grow">
                        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span>
                            Especialistas disponibles (
                            {servicio.trabajadores.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {servicio.trabajadores
                            .slice(0, 3)
                            .map((trabajador) => (
                              <div
                                key={trabajador.id}
                                className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 py-1"
                              >
                                <Avatar className="w-6 h-6">
                                  <AvatarImage
                                    src={"/placeholder.svg"}
                                    alt={trabajador.nombre}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {trabajador.nombre
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium text-gray-700">
                                  {trabajador.nombre}
                                </span>
                              </div>
                            ))}
                          {servicio.trabajadores.length > 3 && (
                            <div className="flex items-center justify-center bg-gray-100 rounded-full px-3 py-1">
                              <span className="text-xs text-gray-600">
                                +{servicio.trabajadores.length - 3} más
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleVerServicio(servicio.id)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all duration-200 transform group-hover:scale-[1.02] mt-auto"
                      >
                        <span>Agendar cita</span>
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
        </div>

        {!isLoading && serviciosFiltrados.length === 0 && (
          <motion.div
            className="text-center py-12 bg-white rounded-lg shadow-md my-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron servicios
            </h3>
            <p className="text-gray-600 mb-6">
              No hay resultados para tu búsqueda actual
            </p>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex items-center"
            >
              <FilterX className="w-4 h-4 mr-2" />
              Limpiar filtros
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}
