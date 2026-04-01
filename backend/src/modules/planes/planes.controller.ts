import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PlanesService } from './planes.service.js';

@Controller('planes')
export class PlanesController {
  constructor(private readonly planesService: PlanesService) {}

  @Get()
  findAll() {
    return this.planesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.planesService.findOne(id);
  }
}
