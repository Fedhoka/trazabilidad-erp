'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email('Email inválido'),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    // The API always returns 204 regardless of whether the email exists.
    // We show success unconditionally to prevent user enumeration.
    await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: values.email }),
    }).catch(() => undefined);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-strong/40">
          <Mail className="size-6 text-primary" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-[1.625rem] font-medium leading-tight tracking-tight text-foreground">
            Revisá tu email
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Si el email está registrado, vas a recibir un enlace en los próximos
            minutos. Revisá también la carpeta de spam.
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Volver al inicio de sesión
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-[1.875rem] font-medium leading-tight tracking-tight text-foreground">
          Recuperar contraseña
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresá tu email y te enviamos un enlace para crear una nueva.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vos@empresa.com"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}
