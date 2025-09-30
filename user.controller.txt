import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { HasRoles } from '../auth/decorators/roles.decorator';
import { Roles } from '../auth/enums/roles.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HasRoles(Roles.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @HasRoles(Roles.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post('dentist')
  @HasRoles(Roles.ADMIN)
  createDentist(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createDentist(createUserDto);
  }

  @Put('dentist/:id')
  @HasRoles(Roles.ADMIN)
  updateDentist(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateDentist(id, updateUserDto);
  }

  @Post('administrative')
  @HasRoles(Roles.ADMIN)
  createAdministrative(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createAdministrative(createUserDto);
  }

  @Put('administrative/:id')
  @HasRoles(Roles.ADMIN)
  updateAdministrative(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateAdministrative(id, updateUserDto);
  }

  @Delete(':id')
  @HasRoles(Roles.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
