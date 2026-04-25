import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly service: RecipesService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  create(@Body() dto: CreateRecipeDto, @CurrentUser() user: User) {
    return this.service.create(dto, user.tenantId);
  }

  @Post(':id/activate')
  activate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.activate(id, user.tenantId);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.archive(id, user.tenantId);
  }
}
