import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/rol.entity';
import { Dentist } from './entities/dentist.entity';
import { Administrative } from './entities/administrative.entity';
import { Roles } from '../auth/enums/roles.enum';
import * as bcryptjs from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Dentist)
    private readonly dentistRepository: Repository<Dentist>,
    @InjectRepository(Administrative)
    private readonly administrativeRepository: Repository<Administrative>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = new User();
    Object.assign(user, {
      ...createUserDto,
      contraseña: await bcryptjs.hash(createUserDto.contraseña, 10)
    });
    return await this.userRepository.save(user);
  }

  async findOneByEmail(email: string) {
    return await this.userRepository.findOne({ 
      where: { correo: email },
      relations: ['rol']
    });
  }

  async findAll() {
    return await this.userRepository.find({
      relations: ['rol'],
      withDeleted: false
    });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['rol']
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (updateUserDto.contraseña) {
      updateUserDto.contraseña = await bcryptjs.hash(updateUserDto.contraseña, 10);
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    return await this.userRepository.softDelete(id);
  }

  async createDentist(createUserDto: CreateUserDto) {
    const rolDentista = await this.roleRepository.findOne({
      where: { nombre: Roles.DENTIST }
    });

    if (!rolDentista) {
      throw new Error('Rol de dentista no encontrado');
    }

    const user = new User();
    Object.assign(user, {
      ...createUserDto,
      contraseña: await bcryptjs.hash(createUserDto.contraseña, 10),
      rol: rolDentista
    });
    const savedUser = await this.userRepository.save(user);

    const dentist = new Dentist();
    Object.assign(dentist, {
      usuario: savedUser,
      especialidad: createUserDto.especialidad
    });
    await this.dentistRepository.save(dentist);

    return savedUser;
  }

  async updateDentist(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    const dentist = await this.dentistRepository.findOne({
      where: { usuario: { id } }
    });

    if (!dentist) {
      throw new NotFoundException(`Dentista con ID de usuario ${id} no encontrado`);
    }

    if (updateUserDto.contraseña) {
      updateUserDto.contraseña = await bcryptjs.hash(updateUserDto.contraseña, 10);
    }

    // Actualizar usuario
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    // Actualizar dentista
    if (updateUserDto.especialidad) {
      Object.assign(dentist, { especialidad: updateUserDto.especialidad });
      await this.dentistRepository.save(dentist);
    }

    return user;
  }

  async createAdministrative(createUserDto: CreateUserDto) {
    const rolAdministrativo = await this.roleRepository.findOne({
      where: { nombre: Roles.ADMINISTRATIVE }
    });

    if (!rolAdministrativo) {
      throw new Error('Rol administrativo no encontrado');
    }

    const user = new User();
    Object.assign(user, {
      ...createUserDto,
      contraseña: await bcryptjs.hash(createUserDto.contraseña, 10),
      rol: rolAdministrativo
    });
    const savedUser = await this.userRepository.save(user);

    const administrative = new Administrative();
    Object.assign(administrative, {
      usuario: savedUser,
      area: createUserDto.area,
      cargo: createUserDto.cargo
    });
    await this.administrativeRepository.save(administrative);

    return savedUser;
  }

  async updateAdministrative(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    const administrative = await this.administrativeRepository.findOne({
      where: { usuario: { id } }
    });

    if (!administrative) {
      throw new NotFoundException(`Administrativo con ID de usuario ${id} no encontrado`);
    }

    if (updateUserDto.contraseña) {
      updateUserDto.contraseña = await bcryptjs.hash(updateUserDto.contraseña, 10);
    }

    // Actualizar usuario
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    // Actualizar administrativo
    if (updateUserDto.area || updateUserDto.cargo) {
      Object.assign(administrative, {
        area: updateUserDto.area,
        cargo: updateUserDto.cargo
      });
      await this.administrativeRepository.save(administrative);
    }

    return user;
  }
}
