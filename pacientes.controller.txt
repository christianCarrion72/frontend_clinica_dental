import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { HasRoles } from '../auth/decorators/roles.decorator';
import { Roles } from '../auth/enums/roles.enum';

@ApiTags('pacientes')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Post()
  @HasRoles(Roles.ADMIN, Roles.DENTIST, Roles.ADMINISTRATIVE)
  create(@Body() createPacienteDto: CreatePacienteDto) {
    return this.pacientesService.create(createPacienteDto);
  }

  @Get()
  @HasRoles(Roles.ADMIN, Roles.DENTIST, Roles.ADMINISTRATIVE)
  findAll() {
    return this.pacientesService.findAll();
  }

  @Get('search')
  @HasRoles(Roles.ADMIN, Roles.DENTIST, Roles.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Buscar pacientes por nombre o ID' })
  @ApiQuery({
    name: 'query',
    required: true,
    description: 'Término de búsqueda (nombre o ID del paciente)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de pacientes que coinciden con la búsqueda',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No se encontraron pacientes',
  })
  async search(@Query('query') query: string) {
    const pacientes = await this.pacientesService.search(query);
    return {
      success: true,
      message: pacientes.length > 0 
        ? 'Pacientes encontrados'
        : 'No se encontraron pacientes',
      data: pacientes,
      total: pacientes.length
    };
  }

  @Get(':id')
  @HasRoles(Roles.ADMIN, Roles.DENTIST, Roles.ADMINISTRATIVE)
  findOne(@Param('id') id: string) {
    return this.pacientesService.findOne(+id);
  }

  @Patch(':id')
  @HasRoles(Roles.ADMIN, Roles.DENTIST, Roles.ADMINISTRATIVE)
  update(
    @Param('id') id: string,
    @Body() updatePacienteDto: UpdatePacienteDto,
  ) {
    return this.pacientesService.update(+id, updatePacienteDto);
  }

  @Delete(':id')
  @HasRoles(Roles.ADMIN, Roles.DENTIST, Roles.ADMINISTRATIVE)
  remove(@Param('id') id: string) {
    return this.pacientesService.remove(+id);
  }
}
