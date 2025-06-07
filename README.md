# SPA-Schedule

SPA-Schedule es una aplicación web desarrollada con Next.js, TypeScript, Prisma y TailwindCSS para la gestión y visualización de horarios en una institución educativa.

## Características principales
- Gestión de usuarios y autenticación
- Visualización de horarios
- Interfaz moderna y responsiva
- Uso de formularios avanzados con validaciones
- Integración con base de datos vía Prisma

## Tecnologías utilizadas
- **Next.js** 15
- **React** 19
- **TypeScript**
- **Prisma** ORM
- **TailwindCSS**
- **Radix UI**
- **React Hook Form** y **Zod** para validaciones

## Instalación y uso
1. Clona el repositorio:
   ```sh
   git clone <URL-del-repositorio>
   cd SPA-Schedule
   ```
2. Instala las dependencias:
   ```sh
   npm install
   ```
3. Configura las variables de entorno en un archivo `.env` (puedes guiarte por `.env.example` si existe).
4. Ejecuta el proyecto en modo desarrollo:
   ```sh
   npm run dev
   ```

## Estructura del proyecto
- `src/` - Código fuente principal
- `components/` - Componentes reutilizables de la interfaz
- `app/` - Páginas y rutas principales
- `lib/` - Utilidades y lógica compartida
- `prisma/` - Esquema y migraciones de base de datos
- `public/` - Archivos estáticos

## Scripts útiles
- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia la aplicación en modo producción
- `npm run lint` - Ejecuta el linter para mantener la calidad del código

## Contribuciones
¡Las contribuciones son bienvenidas! Por favor, crea una rama para tus cambios y abre un Pull Request.

## Licencia
Este proyecto está bajo la licencia MIT.
