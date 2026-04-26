import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, Request } from '@nestjs/common';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  findAll(@Request() req: any, @Query() pagination: PaginationDto) {
    return this.service.findAllByTenant(req.user.tenantId, pagination);
  }

  @Post()
  @Roles(UserRole.OWNER)
  invite(@Body() dto: InviteUserDto, @Request() req: any) {
    return this.service.invite(dto, req.user.tenantId);
  }

  @Patch(':id/role')
  @Roles(UserRole.OWNER)
  updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @Request() req: any,
  ) {
    return this.service.updateRole(id, dto.role, req.user.tenantId);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.OWNER)
  deactivate(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.setActive(id, false, req.user.tenantId);
  }

  @Patch(':id/activate')
  @Roles(UserRole.OWNER)
  activate(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.service.setActive(id, true, req.user.tenantId);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(@Body() dto: ChangePasswordDto, @Request() req: any) {
    return this.service.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
  }
}
