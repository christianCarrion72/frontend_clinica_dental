import { Familiar } from './familiar.interface';

export interface Paciente {
  id?: number;
  nombre: string;
  fecha_nacimiento: string;
  edad: number;
  estado_civil_id: number;
  ocupacion: string;
  telefono: string;
  celular: string;
  familiares?: Familiar[];
}

export interface CreatePacienteDto {
  nombre: string;
  fecha_nacimiento: string;
  edad: number;
  estado_civil_id: number;
  ocupacion: string;
  telefono: string;
  celular: string;
}

export interface UpdatePacienteDto extends Partial<CreatePacienteDto> {}