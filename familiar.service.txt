import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFamiliarDto } from './dto/create-familiar.dto';
import { UpdateFamiliarDto } from './dto/update-familiar.dto';
import { Familiar } from './entities/familiar.entity';

@Injectable()
export class FamiliarsService {
  constructor(
    @InjectRepository(Familiar)
    private readonly familiarRepository: Repository<Familiar>,
  ) {}

  async create(createFamiliarDto: CreateFamiliarDto): Promise<Familiar> {
    const familiar = this.familiarRepository.create(createFamiliarDto);
    return await this.familiarRepository.save(familiar);
  }

  async findAll(): Promise<Familiar[]> {
    return await this.familiarRepository.find({
      relations: ['paciente'],
    });
  }

  async findOne(id: number): Promise<Familiar> {
    const familiar = await this.familiarRepository.findOne({
      where: { id },
      relations: ['paciente'],
    });

    if (!familiar) {
      throw new NotFoundException(`Familiar con ID ${id} no encontrado`);
    }

    return familiar;
  }

  async update(id: number, updateFamiliarDto: UpdateFamiliarDto): Promise<Familiar> {
    const familiar = await this.findOne(id);
    this.familiarRepository.merge(familiar, updateFamiliarDto);
    return await this.familiarRepository.save(familiar);
  }

  async remove(id: number): Promise<void> {
    const familiar = await this.findOne(id);
    await this.familiarRepository.softRemove(familiar);
  }
}
