import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { User, UserRole } from './entities/user.entity';
import { InviteUserDto } from './dto/invite-user.dto';

type SafeUser = Omit<User, 'passwordHash'>;

function omitHash(u: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safe } = u;
  return safe;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  async findAllByTenant(tenantId: string): Promise<SafeUser[]> {
    const users = await this.usersRepo.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });
    return users.map(omitHash);
  }

  async invite(dto: InviteUserDto, tenantId: string): Promise<SafeUser> {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersRepo.save(
      this.usersRepo.create({ email: dto.email, passwordHash, role: dto.role, tenantId }),
    );
    return omitHash(user);
  }

  async updateRole(id: string, role: UserRole, tenantId: string): Promise<SafeUser> {
    const user = await this.usersRepo.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    return omitHash(await this.usersRepo.save(user));
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    user.passwordHash = await argon2.hash(newPassword);
    await this.usersRepo.save(user);
  }

  async setActive(id: string, isActive: boolean, tenantId: string): Promise<SafeUser> {
    const user = await this.usersRepo.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = isActive;
    return omitHash(await this.usersRepo.save(user));
  }
}
