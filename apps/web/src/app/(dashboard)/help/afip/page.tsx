'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileWarning,
  KeyRound,
  Lightbulb,
  ShieldCheck,
  Terminal,
  ToggleLeft,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '@/components/ui/code-block';
import { cn } from '@/lib/utils';

interface StepProps {
  number: number;
  title: string;
  icon: React.ElementType;
  description?: string;
  children: React.ReactNode;
}

function Step({ number, title, icon: Icon, description, children }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-mono text-sm font-semibold text-primary ring-1 ring-primary/20">
            {number}
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" aria-hidden />
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="mt-1">{description}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-relaxed text-foreground/90">
        {children}
      </CardContent>
    </Card>
  );
}

function Callout({
  tone = 'info',
  icon: Icon,
  children,
}: {
  tone?: 'info' | 'warning' | 'success';
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  const toneClasses =
    tone === 'warning'
      ? 'border-warning/30 bg-warning/5'
      : tone === 'success'
      ? 'border-success/30 bg-success/5'
      : 'border-info/30 bg-info/5';
  const FallbackIcon =
    tone === 'warning' ? AlertTriangle : tone === 'success' ? CheckCircle2 : Lightbulb;
  const I = Icon ?? FallbackIcon;
  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed',
        toneClasses,
      )}
    >
      <I className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
      <div className="space-y-1 text-foreground/90">{children}</div>
    </div>
  );
}

function ExternalLinkPill({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      {children}
      <ExternalLink className="size-3" aria-hidden />
    </a>
  );
}

export default function AfipManualPage() {
  return (
    <>
      <PageHeader
        title="Manual de facturación AFIP"
        description="Guía paso a paso para configurar y emitir facturas electrónicas con el WSFE."
      />

      {/* Intro callout */}
      <Callout tone="info" icon={Lightbulb}>
        <p className="font-medium">
          ¿Qué vas a necesitar para arrancar?
        </p>
        <ul className="ml-4 list-disc space-y-0.5">
          <li>Tu CUIT y clave fiscal de AFIP nivel 3 o superior.</li>
          <li>OpenSSL instalado en tu compu (viene en macOS/Linux por default).</li>
          <li>Saber qué punto de venta vas a usar (4 dígitos, ej: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">0001</code>).</li>
          <li>Tener al menos un cliente cargado en el sistema con condición IVA.</li>
        </ul>
      </Callout>

      {/* Step 1: Generate certificate */}
      <Step
        number={1}
        title="Generar el certificado X.509"
        icon={KeyRound}
        description="AFIP requiere un par de claves asimétricas para autenticarse. Lo generás vos con OpenSSL — es local, no se envía a nadie."
      >
        <p>
          Abrí una terminal y ejecutá los siguientes 3 comandos en orden. El primero
          genera la clave privada (guardala como un tesoro: nunca la subas a Git ni
          la mandes por mail).
        </p>

        <CodeBlock label="1. Clave privada">
{`openssl genrsa -out trazabilidad.key 2048`}
        </CodeBlock>

        <p>El segundo crea el CSR (solicitud de certificado). Reemplazá los datos:</p>

        <CodeBlock label="2. Solicitud de firma (CSR)">
{`openssl req -new -key trazabilidad.key -subj "/C=AR/O=La Empanada Gourmet/CN=trazabilidad/serialNumber=CUIT 20123456789" -out trazabilidad.csr`}
        </CodeBlock>

        <Callout tone="warning">
          <p>
            <strong>Cuidado con el CN y serialNumber.</strong> El{' '}
            <code className="rounded bg-muted px-1 font-mono text-xs">CN</code> debe ser
            único por entorno (ej: <code>trazabilidad-test</code> y{' '}
            <code>trazabilidad-prod</code> distintos). El{' '}
            <code className="rounded bg-muted px-1 font-mono text-xs">serialNumber</code>{' '}
            debe contener "CUIT" seguido de tu número sin guiones.
          </p>
        </Callout>

        <p>
          Subí el archivo <code className="rounded bg-muted px-1 font-mono text-xs">.csr</code>{' '}
          al portal de AFIP para que te firme. Vas a recibir un{' '}
          <code className="rounded bg-muted px-1 font-mono text-xs">.crt</code> a cambio.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <ExternalLinkPill href="https://auth.afip.gob.ar/contribuyente_/login.xhtml">
            Iniciar sesión en AFIP
          </ExternalLinkPill>
          <ExternalLinkPill href="https://www.afip.gob.ar/ws/documentacion/certificados.asp">
            Documentación oficial
          </ExternalLinkPill>
        </div>
      </Step>

      {/* Step 2: Adminstrador de certificados */}
      <Step
        number={2}
        title="Subir el CSR y descargar el certificado"
        icon={ShieldCheck}
        description="En el portal de AFIP, sección Administrador de Certificados Digitales."
      >
        <ol className="ml-4 list-decimal space-y-1.5">
          <li>Ingresá al servicio <strong>“Administración de Certificados Digitales”</strong>.</li>
          <li>
            Elegí la representación bajo la cual operás (vos mismo, o una empresa).
          </li>
          <li>
            Clic en <strong>“Nuevo certificado”</strong> y subí el archivo{' '}
            <code className="rounded bg-muted px-1 font-mono text-xs">trazabilidad.csr</code>{' '}
            del paso anterior.
          </li>
          <li>
            Descargá el <code className="rounded bg-muted px-1 font-mono text-xs">.crt</code>{' '}
            firmado y guardalo junto a la clave privada.
          </li>
        </ol>

        <Callout tone="info">
          <p>
            El certificado tiene una vigencia (típicamente 2 años). Anotate la fecha
            de vencimiento — vas a tener que renovarlo antes de que caduque o las
            facturas dejarán de autorizarse.
          </p>
        </Callout>
      </Step>

      {/* Step 3: Habilitar servicio WSFE */}
      <Step
        number={3}
        title="Asociar el certificado al servicio WSFE"
        icon={ToggleLeft}
        description='AFIP necesita saber que tu certificado puede consumir el web service de facturación electrónica.'
      >
        <ol className="ml-4 list-decimal space-y-1.5">
          <li>
            Volvé al portal de AFIP, esta vez al servicio{' '}
            <strong>“Administrador de Relaciones de Clave Fiscal”</strong>.
          </li>
          <li>
            Clic en <strong>“Nueva Relación”</strong> y seleccioná tu CUIT como representante.
          </li>
          <li>
            En <strong>Servicio</strong>, buscá <strong>WSFE - Web Service Facturación Electrónica</strong>{' '}
            (o <strong>WSFEv1</strong> según versión).
          </li>
          <li>
            En <strong>Representante</strong>, elegí el certificado que generaste antes
            (mismo CN).
          </li>
          <li>Confirmá. Aceptá el formulario electrónico que se descarga.</li>
        </ol>

        <Callout tone="warning">
          <p>
            Si vas a operar en <strong>homologación</strong> (testing) primero, hacé este paso
            con el servicio <strong>“wsfe-homo”</strong>. Después repetilo con el certificado de
            producción cuando estés listo.
          </p>
        </Callout>
      </Step>

      {/* Step 4: Configurar el sistema */}
      <Step
        number={4}
        title="Cargar el certificado y la CUIT en el sistema"
        icon={Terminal}
        description="Convertimos los archivos a variables de entorno que el API consume al arrancar."
      >
        <p>
          El API espera 3 variables. Las cargás en el panel de Railway (o en tu{' '}
          <code className="rounded bg-muted px-1 font-mono text-xs">.env</code> si corrés local):
        </p>

        <CodeBlock label="Variables de entorno">
{`AFIP_ENV=mock                 # mock | homologacion | produccion
AFIP_CUIT=20123456789         # tu CUIT sin guiones
AFIP_CERT_PEM=<contenido del .crt>
AFIP_KEY_PEM=<contenido del .key>`}
        </CodeBlock>

        <p>
          Para volcar el contenido completo del archivo en una sola línea (así se
          puede pegar en el dashboard de Railway), usá:
        </p>

        <CodeBlock label="Codificar el .crt en una línea">
{`awk 'BEGIN{ORS="\\\\n"} {print}' trazabilidad.crt`}
        </CodeBlock>

        <Callout tone="warning" icon={FileWarning}>
          <p>
            <strong>Nunca commitees estos valores a Git.</strong> Si por error subiste
            la clave privada al repo, regenerá el certificado y revocá el viejo en
            AFIP. La clave privada filtrada permite a un atacante facturar a tu nombre.
          </p>
        </Callout>
      </Step>

      {/* Step 5: Dar de alta puntos de venta */}
      <Step
        number={5}
        title="Dar de alta puntos de venta"
        icon={CheckCircle2}
        description="Cada serie de comprobantes corresponde a un punto de venta numerado."
      >
        <ol className="ml-4 list-decimal space-y-1.5">
          <li>
            En AFIP, andá a{' '}
            <strong>“Administración de Puntos de Venta y Domicilios”</strong>.
          </li>
          <li>
            Agregá un punto de venta del tipo{' '}
            <strong>“Web Services - RECE para aplicativo y web services”</strong>.
          </li>
          <li>
            Anotá el número (ej: <code className="rounded bg-muted px-1 font-mono text-xs">0003</code>) — lo vas
            a cargar en el sistema.
          </li>
          <li>
            En la app, andá a <Link href="/fiscal" className="text-primary underline">Fiscal → Puntos de venta</Link> y agregá el punto con su número y nombre.
          </li>
        </ol>

        <Callout tone="info">
          <p>
            Si vendés en mostrador y por web, conviene tener dos puntos de venta
            distintos. Las series no se pueden mezclar y un comprobante salteado en la
            numeración no se puede recuperar.
          </p>
        </Callout>
      </Step>

      {/* Step 6: Probar en homologación */}
      <Step
        number={6}
        title="Probar en homologación antes de producción"
        icon={Lightbulb}
        description="AFIP tiene un entorno de testing idéntico a producción pero sin valor fiscal."
      >
        <ol className="ml-4 list-decimal space-y-1.5">
          <li>
            Asegurate de que <code className="rounded bg-muted px-1 font-mono text-xs">AFIP_ENV=homologacion</code>{' '}
            en las variables del API.
          </li>
          <li>
            Creá un cliente de prueba con CUIT genérico de testing (ej:{' '}
            <code className="rounded bg-muted px-1 font-mono text-xs">20000000001</code>).
          </li>
          <li>
            Generá un pedido de venta y emitilo desde la pantalla de Pedido. Si todo
            anda bien, recibís un <strong>CAE</strong> ficticio.
          </li>
          <li>
            Verificá el CAE consultando el portal de homologación de AFIP.
          </li>
        </ol>

        <Callout tone="warning">
          <p>
            <strong>Los CAE de homologación no son reales.</strong> No los uses para
            operar comercialmente. Cuando estés conforme, cambiá{' '}
            <code className="rounded bg-muted px-1 font-mono text-xs">AFIP_ENV=produccion</code>{' '}
            y reiniciá el servicio.
          </p>
        </Callout>
      </Step>

      {/* Step 7: Switch to production */}
      <Step
        number={7}
        title="Pasar a producción"
        icon={ShieldCheck}
        description="Una vez que las pruebas funcionan, repetís los pasos 1-3 con un certificado de producción."
      >
        <ol className="ml-4 list-decimal space-y-1.5">
          <li>
            Generá un nuevo certificado X.509 con un CN distinto (ej:{' '}
            <code className="rounded bg-muted px-1 font-mono text-xs">trazabilidad-prod</code>).
          </li>
          <li>
            Repetí el paso 3 pero asociando el certificado a{' '}
            <strong>WSFE</strong> (sin "-homo").
          </li>
          <li>
            Actualizá las variables de entorno en Railway con los archivos de
            producción y cambiá <code className="rounded bg-muted px-1 font-mono text-xs">AFIP_ENV=produccion</code>.
          </li>
          <li>
            Verificá con una factura chica (ej: $100) que se autoriza correctamente.
          </li>
        </ol>

        <Callout tone="success">
          <p>
            <strong>Listo.</strong> A partir de acá, cada vez que un Pedido de Venta se
            facture, el sistema llama al WSFE y obtiene un CAE real con código de barras.
          </p>
        </Callout>
      </Step>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="size-4 text-warning" aria-hidden />
            Troubleshooting de errores frecuentes
          </CardTitle>
          <CardDescription>
            Códigos AFIP que aparecen en el campo "Detalle" de la factura cuando algo falla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/60">
            {ERRORS.map((err) => (
              <li key={err.code} className="flex items-start gap-3 py-3 text-sm">
                <Badge variant="destructive" className="shrink-0 font-mono">
                  {err.code}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{err.title}</p>
                  <p className="text-muted-foreground">{err.fix}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Final CTA */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 text-sm">
        <div>
          <p className="font-semibold text-foreground">¿Ya tenés todo configurado?</p>
          <p className="text-muted-foreground">
            Andá a Fiscal y revisá tus puntos de venta y comprobantes emitidos.
          </p>
        </div>
        <Link
          href="/fiscal"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Ir a Fiscal
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </>
  );
}

const ERRORS: { code: string; title: string; fix: string }[] = [
  {
    code: '600',
    title: 'Token o sign vencidos',
    fix: 'El TA (ticket de acceso) caducó. El sistema lo refresca automáticamente cada 12 hs; si persiste, reiniciá el servicio del API.',
  },
  {
    code: '1004',
    title: 'CUIT inválido o no autorizado',
    fix: 'Verificá que la variable AFIP_CUIT esté correcta y que el certificado esté asociado al servicio WSFE en AFIP.',
  },
  {
    code: '10015',
    title: 'Cliente sin condición IVA configurada',
    fix: 'Editá el cliente y completá la condición frente al IVA (RI, CF, MONO o EXENTO). El sistema usa este dato para elegir el tipo de comprobante.',
  },
  {
    code: '10016',
    title: 'Punto de venta no existe',
    fix: 'El número de PV no está dado de alta en AFIP o no está marcado como "Web Services". Volvé al paso 5.',
  },
  {
    code: '10048',
    title: 'Importe no coincide con el detalle',
    fix: 'El total del comprobante no es exactamente la suma de los importes de cada línea + IVA. Suele ser un error de redondeo — revisá los precios unitarios del Pedido.',
  },
  {
    code: '10063',
    title: 'CAE ya autorizado para este número',
    fix: 'Estás intentando re-emitir una factura ya autorizada. Revisá el último número emitido en Fiscal y reintentá con el siguiente.',
  },
];
