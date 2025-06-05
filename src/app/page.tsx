"use client";

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
import { authClient } from "@/lib/auth-client";
import {
  Calendar,
  ChevronRight,
  Clock,
  LogOut,
  Search,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";

type Servicio = {
  id: string;
  nombre: string;
  descripcion?: string;
  duracionMinutos: number;
  precio: number;
  trabajadores: {
    id: string;
    nombre: string;
    especialidad: string;
  }[];
};

const serviciosEjemplo: Servicio[] = [
  {
    id: "1",
    nombre: "Corte de Cabello Clásico",
    descripcion:
      "Corte tradicional con acabado profesional, incluye lavado y peinado",
    duracionMinutos: 45,
    precio: 25.0,
    trabajadores: [
      {
        id: "1",
        nombre: "Carlos Mendez",
        especialidad: "Cortes",
      },
      {
        id: "2",
        nombre: "Ana García",
        especialidad: "Cortes",
      },
    ],
  },
  {
    id: "2",
    nombre: "Coloración Completa",
    descripcion:
      "Cambio de color completo con productos premium y tratamiento post-color",
    duracionMinutos: 180,
    precio: 85.0,
    trabajadores: [
      {
        id: "2",
        nombre: "Ana García",
        especialidad: "Coloración",
      },
      {
        id: "3",
        nombre: "Sofia Rodriguez",
        especialidad: "Coloración",
      },
    ],
  },
  {
    id: "3",
    nombre: "Tratamiento Capilar",
    descripcion: "Hidratación profunda y reparación del cabello dañado",
    duracionMinutos: 60,
    precio: 40.0,
    trabajadores: [
      {
        id: "3",
        nombre: "Sofia Rodriguez",
        especialidad: "Tratamientos",
      },
    ],
  },
  {
    id: "4",
    nombre: "Peinado para Eventos",
    descripcion:
      "Peinado elegante para bodas, graduaciones y eventos especiales",
    duracionMinutos: 90,
    precio: 60.0,
    trabajadores: [
      {
        id: "2",
        nombre: "Ana García",
        especialidad: "Peinados",
      },
      {
        id: "3",
        nombre: "Sofia Rodriguez",
        especialidad: "Peinados",
      },
    ],
  },
  {
    id: "5",
    nombre: "Manicure y Pedicure",
    descripcion: "Cuidado completo de uñas con esmaltado semipermanente",
    duracionMinutos: 75,
    precio: 35.0,
    trabajadores: [
      {
        id: "4",
        nombre: "María López",
        especialidad: "Manicure",
      },
    ],
  },
];

const { data: session } = await authClient.getSession();
const usuarioActual = session?.user;

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [servicios] = useState<Servicio[]>(serviciosEjemplo);

  const serviciosFiltrados = servicios.filter(
    (servicio) =>
      servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servicio.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleVerServicio = (servicioId: string) => {
    console.log("Ver detalles del servicio:", servicioId);
    // Aquí navegarías a la página de detalles del servicio
  };

  const handleLogout = () => {
    console.log("Cerrando sesión...");
    // Aquí implementarías la lógica de logout
  };

  const handleAdminPanel = () => {
    console.log("Accediendo al panel de administración...");
  };

  if (!usuarioActual) {
    return;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Beauty Salon
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {usuarioActual.role && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAdminPanel}
                  className="flex items-center space-x-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                </Button>
              )}

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
                      <AvatarFallback>
                        {usuarioActual.name
                          .split(" ")
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
                    <p className="text-sm font-medium">{usuarioActual.name}</p>
                    <p className="text-xs text-gray-500">
                      {usuarioActual.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Calendar className="w-4 h-4 mr-2" />
                    Mis Citas
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido, {usuarioActual.name.split(" ")[0]} 👋
          </h2>
          <p className="text-gray-600">
            Descubre nuestros servicios y agenda tu próxima cita
          </p>
        </div>

        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviciosFiltrados.map((servicio) => (
            <Card
              key={servicio.id}
              className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm"
            >
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

              <CardContent className="space-y-4">
                {/* Duración */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>{formatearDuracion(servicio.duracionMinutos)}</span>
                </div>

                {/* Trabajadores */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>
                      Especialistas disponibles ({servicio.trabajadores.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {servicio.trabajadores.slice(0, 3).map((trabajador) => (
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
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium transition-all duration-200 transform group-hover:scale-[1.02]"
                >
                  <span>Ver detalles y agendar</span>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {serviciosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron servicios
            </h3>
            <p className="text-gray-600">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
