import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly cfg: ConfigService) {
    const host = cfg.get<string>('SMTP_HOST');
    this.from = cfg.get<string>('EMAIL_FROM') ?? 'Trazabilidad ERP <noreply@trazabilidad.com>';

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: cfg.get<number>('SMTP_PORT') ?? 587,
        secure: cfg.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: cfg.get<string>('SMTP_USER'),
          pass: cfg.get<string>('SMTP_PASS'),
        },
      });
      this.logger.log(`Email transport configured → ${host}`);
    } else {
      this.transporter = null;
      this.logger.warn('SMTP_HOST not set — emails will be logged to console (dev mode)');
    }
  }

  async sendWelcome(to: string, tenantName: string): Promise<void> {
    const subject = `Bienvenido a Trazabilidad ERP — ${tenantName}`;
    const html = `
      <h2>¡Bienvenido, ${tenantName}!</h2>
      <p>Tu cuenta fue creada exitosamente.</p>
      <p>Podés ingresar con el email <strong>${to}</strong>.</p>
      <p>Si tenés alguna duda, respondé este email.</p>
      <br/>
      <p>— El equipo de Trazabilidad ERP</p>
    `;
    await this.send({ to, subject, html });
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const appUrl = this.cfg.get<string>('APP_URL') ?? 'http://localhost:3000';
    const link = `${appUrl}/reset-password?token=${token}`;
    const subject = 'Restablecer contraseña — Trazabilidad ERP';
    const html = `
      <h2>Restablecé tu contraseña</h2>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p>Hacé clic en el siguiente enlace (válido por 1 hora):</p>
      <p><a href="${link}">${link}</a></p>
      <p>Si no solicitaste este cambio, ignorá este email.</p>
      <br/>
      <p>— El equipo de Trazabilidad ERP</p>
    `;
    await this.send({ to, subject, html });
  }

  private async send(opts: { to: string; subject: string; html: string }): Promise<void> {
    if (!this.transporter) {
      // Dev fallback — print to console so the developer can inspect the email
      this.logger.log(`[EMAIL DEV] To: ${opts.to} | Subject: ${opts.subject}`);
      this.logger.debug(`[EMAIL DEV] Body:\n${opts.html.replace(/<[^>]+>/g, '')}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, ...opts });
    } catch (err: unknown) {
      // Never let email failures crash the request — log and continue
      this.logger.error(`Failed to send email to ${opts.to}: ${(err as Error).message}`);
    }
  }
}
