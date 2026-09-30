import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

// 1. Interfaz para tipar req.user y evitar 'any'
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    restaurantId: string;
  };
}

@ApiTags('menus')
@ApiBearerAuth()
@Controller('restaurants/:restaurantId/menus')
@UseGuards(JwtAuthGuard)
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo menú' })
  create(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Body() createMenuDto: CreateMenuDto,
  ) {
    return this.menusService.create(req.user.id, restaurantId, createMenuDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los menús' })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.menusService.findAll(req.user.id, restaurantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un menú por ID' })
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
  ) {
    return this.menusService.findOne(req.user.id, restaurantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un menú' })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Body() updateMenuDto: UpdateMenuDto,
  ) {
    return this.menusService.update(
      req.user.id,
      restaurantId,
      id,
      updateMenuDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un menú' })
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
  ) {
    return this.menusService.remove(req.user.id, restaurantId, id);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clonar un menú' })
  clone(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Body('newName') newName?: string,
  ) {
    return this.menusService.clone(
      req.user.id,
      restaurantId,
      id,
      newName ?? '',
    );
  }
}
