import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FamiliarsService } from './familiars.service';
import { CreateFamiliarDto } from './dto/create-familiar.dto';
import { UpdateFamiliarDto } from './dto/update-familiar.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { HasRoles } from '../auth/decorators/roles.decorator';
import { Roles } from '../auth/enums/roles.enum';

@ApiTags('familiares')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('familiares')
export class FamiliarsController {
  constructor(private readonly familiarsService: FamiliarsService) {}

  @Post()
  @HasRoles(Roles.ADMIN, Roles.DENTIST, Roles.ADMINISTRATIVE)
  create(@Body() createFamiliarDto: CreateFamiliarDto) {
    return this.familiarsService.create(createFamiliarDto);
  }

  @Get()
  @HasRoles(Roles.ADMIN, Roles.DENTIST, Roles.ADMINISTRATIVE)
  findAll() {
    return this.familiarsService.findAll();
  }

  @Get(':id')
  @HasRoles(Roles.ADMIN, Roles.DENTIST, Roles.ADMINISTRATIVE)
  findOne(@Param('id') id: string) {
    return this.familiarsService.findOne(+id);
  }

  @Patch(':id')
  @HasRoles(Roles.ADMIN, Roles.DENTIST, Roles.ADMINISTRATIVE)
  update(
    @Param('id') id: string,
    @Body() updateFamiliarDto: UpdateFamiliarDto,
  ) {
    return this.familiarsService.update(+id, updateFamiliarDto);
  }

  @Delete(':id')
  @HasRoles(Roles.ADMIN, Roles.DENTIST, Roles.ADMINISTRATIVE)
  remove(@Param('id') id: string) {
    return this.familiarsService.remove(+id);
  }
}
