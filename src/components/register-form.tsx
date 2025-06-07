"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription } from "./ui/alert";
const registerSchema = z.object({
  name: z.string().min(1, "Nombre completo es requerido"),
  email: z.string().email("Email inválido").min(1, "Email es requerido"),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres"),
});

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
  const [error, setError] = React.useState<string | null>(null);
  const [sucess, setSuccess] = React.useState<string | null>(null);
  const router = useRouter();
  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
    console.log("Register data:", data);
    const { error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
      callbackURL: "/",
    });
    if (error) {
      console.error("Registration error:", error.message);
      setError(error.message ?? "");
      return;
    }
    console.log("Registration successful");
    setSuccess("Registro exitoso, por favor inicia sesión.");
    router.push("/login");
    setError(null);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Bienvenido</h1>
                  <p className="text-muted-foreground text-balance">
                    Únete a SPA
                  </p>
                  {error && (
                    <Alert className="mt-4">
                      <AlertDescription>
                        {error && <div className="text-red-500">{error}</div>}
                      </AlertDescription>
                    </Alert>
                  )}

                  {sucess && (
                    <Alert className="mt-4">
                      <AlertDescription className="text-green-500">
                        {sucess}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="grid gap-1">
                      <FormLabel>Nombre completo</FormLabel>
                      <FormControl>
                        <Input {...field} id="name" placeholder="Juan Perez" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid gap-1">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="m@example.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid gap-1">
                      <div className="flex items-center">
                        <FormLabel htmlFor="password">Contraseña</FormLabel>
                      </div>
                      <FormControl>
                        <Input {...field} id="password" type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                  Registrar
                </Button>

                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
                    O continua con
                  </span>
                </div>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() =>
                    authClient.signIn.social({
                      provider: "google",
                      callbackURL: "/",
                    })
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Inicia con Google</span>
                </Button>

                <div className="text-center text-sm">
                  ¿Ya tienes cuenta?{" "}
                  <a href="#" className="underline underline-offset-4">
                    Inicia sesión
                  </a>
                </div>
              </div>
            </form>
          </Form>

          <div className="bg-muted relative hidden md:block">
            <img
              src="https://cdn2.salud180.com/sites/default/files/spaencasc.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
