'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  tenantName: z.string().min(2, 'Mínimo 2 caracteres'),
  ownerEmail: z.string().email('Email inválido'),
  ownerPassword: z.string().min(8, 'Mínimo 8 caracteres'),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { registerTenant } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await registerTenant(
        values.tenantName,
        values.ownerEmail,
        values.ownerPassword,
      );
      router.replace('/dashboard');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Error al registrar');
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-[1.875rem] font-medium leading-tight tracking-tight text-foreground">
          Crear empresa
        </h1>
        <p className="text-sm text-muted-foreground">
          Registrate gratis. Sin tarjeta de crédito. Empezás a operar en minutos.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="tenantName">Nombre de la empresa</Label>
          <Input
            id="tenantName"
            placeholder="Ej: La Empanada Gourmet"
            {...register('tenantName')}
          />
          {errors.tenantName && (
            <p className="text-xs text-destructive">
              {errors.tenantName.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ownerEmail">Email del responsable</Label>
          <Input
            id="ownerEmail"
            type="email"
            autoComplete="email"
            placeholder="vos@empresa.com"
            {...register('ownerEmail')}
          />
          {errors.ownerEmail && (
            <p className="text-xs text-destructive">
              {errors.ownerEmail.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ownerPassword">Contraseña</Label>
          <Input
            id="ownerPassword"
            type="password"
            autoComplete="new-password"
            {...register('ownerPassword')}
          />
          {errors.ownerPassword && (
            <p className="text-xs text-destructive">
              {errors.ownerPassword.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registrando…' : 'Crear empresa'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{' '}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Ingresar
        </Link>
      </p>
    </div>
  );
}
