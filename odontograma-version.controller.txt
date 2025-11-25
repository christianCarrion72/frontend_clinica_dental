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
import { OdontrogramaVersionService } from './odontrograma-version.service';
import { CreateOdontrogramaVersionDto } from './dto/create-odontrograma-version.dto';
import { UpdateOdontrogramaVersionDto } from './dto/update-odontrograma-version.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@ApiTags('odontrograma version')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('odontrograma-version')
export class OdontrogramaVersionController {
  constructor(
    private readonly odontrogramaVersionService: OdontrogramaVersionService,
  ) {}

  @Post()
  async create(
    @Body() createOdontrogramaVersionDto: CreateOdontrogramaVersionDto,
  ) {
    return await this.odontrogramaVersionService.create(
      createOdontrogramaVersionDto,
    );
  }

  @Get()
  async findAll() {
    return await this.odontrogramaVersionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.odontrogramaVersionService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateOdontrogramaVersionDto: UpdateOdontrogramaVersionDto,
  ) {
    return await this.odontrogramaVersionService.update(
      id,
      updateOdontrogramaVersionDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.odontrogramaVersionService.remove(id);
  }
}
