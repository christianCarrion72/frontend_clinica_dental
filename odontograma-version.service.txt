import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OdontrogramaVersion } from './entities/odontrograma-version.entity';
import { Odontograma } from 'src/odontograma/entities/odontograma.entity';
import { CreateOdontrogramaVersionDto } from './dto/create-odontrograma-version.dto';
import { UpdateOdontrogramaVersionDto } from './dto/update-odontrograma-version.dto';

@Injectable()
export class OdontrogramaVersionService {
  constructor(
    @InjectRepository(OdontrogramaVersion)
    private readonly versionRepository: Repository<OdontrogramaVersion>,
    @InjectRepository(Odontograma)
    private readonly odontogramaRepository: Repository<Odontograma>,
  ) {}

  async create(
    createDto: CreateOdontrogramaVersionDto,
  ): Promise<OdontrogramaVersion> {
    const odontograma = await this.odontogramaRepository.findOneBy({
      id: createDto.odontogramaId,
    });
    if (!odontograma)
      throw new BadRequestException('Odontograma no encontrado');

    const version = this.versionRepository.create({
      nombreVersion: createDto.nombreVersion,
      json: createDto.json,
      odontograma,
    });

    return await this.versionRepository.save(version);
  }

  async findAll(): Promise<OdontrogramaVersion[]> {
    return await this.versionRepository.find({
      relations: ['odontograma'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<OdontrogramaVersion> {
    const version = await this.versionRepository.findOne({
      where: { id },
      relations: ['odontograma'],
    });
    if (!version)
      throw new NotFoundException(
        `Versión de odontograma con ID ${id} no encontrada`,
      );
    return version;
  }

  async update(
    id: number,
    updateDto: UpdateOdontrogramaVersionDto,
  ): Promise<OdontrogramaVersion> {
    const version = await this.versionRepository.findOne({
      where: { id },
      relations: ['odontograma'],
    });
    if (!version)
      throw new NotFoundException(
        `Versión de odontograma con ID ${id} no encontrada`,
      );

    if (updateDto.nombreVersion !== undefined) {
      version.nombreVersion = updateDto.nombreVersion;
    }

    if (updateDto.json !== undefined) {
      version.json = { ...version.json, ...updateDto.json };
    }

    if (updateDto.odontogramaId !== undefined) {
      const odontograma = await this.odontogramaRepository.findOneBy({
        id: updateDto.odontogramaId,
      });
      if (!odontograma)
        throw new BadRequestException('Odontograma no encontrado');
      version.odontograma = odontograma;
    }

    return await this.versionRepository.save(version);
  }

  async remove(id: number): Promise<void> {
    const version = await this.versionRepository.findOneBy({ id });
    if (!version)
      throw new NotFoundException(
        `Versión de odontograma con ID ${id} no encontrada`,
      );
    await this.versionRepository.softDelete(version);
  }
}
