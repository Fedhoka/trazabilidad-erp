import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { UserRole } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';

const BLOCKLIST_PREFIX = 'rt:bl:';
const RESET_PREFIX = 'pwd:reset:';
const RESET_TTL_SECONDS = 3_600; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
  ) {}

  async registerTenant(dto: RegisterTenantDto) {
    const slug = dto.tenantName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const existing = await this.tenantsService.findBySlug(slug);
    if (existing) throw new BadRequestException('Tenant slug already exists');

    const existingUser = await this.usersService.findByEmail(dto.ownerEmail);
    if (existingUser) throw new BadRequestException('Email already registered');

    const tenant = await this.tenantsService.create({ name: dto.tenantName, slug });
    const passwordHash = await argon2.hash(dto.ownerPassword);
    const user = await this.usersService.create({
      email: dto.ownerEmail,
      passwordHash,
      role: UserRole.OWNER,
      tenantId: tenant.id,
    });

    const tokens = this.issueTokens(user);
    // Fire-and-forget — never delay the registration response for email
    void this.email.sendWelcome(user.email, tenant.name);
    return tokens;
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account inactive');
    return this.issueTokens(user);
  }

  async refresh(token: string) {
    try {
      const hash = this.tokenHash(token);
      const blocked = await this.redis.exists(BLOCKLIST_PREFIX + hash);
      if (blocked) throw new UnauthorizedException('Token revoked');

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) throw new UnauthorizedException();
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<void> {
    try {
      const payload = this.jwtService.decode(token) as { exp?: number } | null;
      const ttl = payload?.exp ? payload.exp - Math.floor(Date.now() / 1000) : 0;
      if (ttl > 0) {
        const hash = this.tokenHash(token);
        await this.redis.set(BLOCKLIST_PREFIX + hash, '1', ttl);
      }
    } catch {
      // Non-fatal — client should clear tokens regardless
    }
  }

  /**
   * Sends a password-reset link. Always returns 204 regardless of whether
   * the email exists — this prevents user enumeration.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // silent — do not reveal existence

    const token = crypto.randomBytes(32).toString('hex');
    const hash = this.tokenHash(token);
    await this.redis.set(RESET_PREFIX + hash, user.id, RESET_TTL_SECONDS);
    void this.email.sendPasswordReset(email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hash = this.tokenHash(token);
    const userId = await this.redis.get(RESET_PREFIX + hash);
    if (!userId) throw new BadRequestException('Token inválido o expirado');

    await this.usersService.forceResetPassword(userId, newPassword);
    // Invalidate so the same token cannot be reused
    await this.redis.del(RESET_PREFIX + hash);
  }

  private tokenHash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private issueTokens(user: { id: string; email: string; tenantId: string; role: UserRole }) {
    const payload = { sub: user.id, email: user.email, tenantId: user.tenantId, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
    });
    return { accessToken, refreshToken };
  }
}
