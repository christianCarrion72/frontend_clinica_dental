export interface Familiar {
  id?: number;
  paciente_id: number;
  nombre: string;
  parentesco: string;
  celular: string;
}

export interface CreateFamiliarDto {
  paciente_id: number;
  nombre: string;
  parentesco: string;
  celular: string;
}

export interface UpdateFamiliarDto extends Partial<CreateFamiliarDto> {}