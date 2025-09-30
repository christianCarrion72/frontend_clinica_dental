import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { Paciente } from './entities/paciente.entity';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
  ) {}

  async create(createPacienteDto: CreatePacienteDto): Promise<Paciente> {
    const paciente = this.pacienteRepository.create(createPacienteDto);
    return await this.pacienteRepository.save(paciente);
  }

  async findAll(): Promise<Paciente[]> {
    return await this.pacienteRepository.find({
      relations: ['estadoCivil', 'familiares'],
    });
  }

  async findOne(id: number): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id },
      relations: ['estadoCivil', 'familiares'],
    });

    if (!paciente) {
      throw new NotFoundException(`Paciente con ID ${id} no encontrado`);
    }

    return paciente;
  }

  async update(id: number, updatePacienteDto: UpdatePacienteDto): Promise<Paciente> {
    const paciente = await this.findOne(id);
    this.pacienteRepository.merge(paciente, updatePacienteDto);
    return await this.pacienteRepository.save(paciente);
  }

  async remove(id: number): Promise<void> {
    const paciente = await this.findOne(id);
    await this.pacienteRepository.softRemove(paciente);
  }

  async search(query: string): Promise<Paciente[]> {
    if (/^\d+$/.test(query)) {
      const pacientePorId = await this.pacienteRepository.findOne({
        where: { id: parseInt(query) },
        relations: ['estadoCivil', 'familiares'],
      });
      return pacientePorId ? [pacientePorId] : [];
    }

    const pacientes = await this.pacienteRepository.find({
      where: {
        nombre: ILike(`%${query}%`),
      },
      relations: ['estadoCivil', 'familiares'],
    });

    return pacientes;
  }
}
