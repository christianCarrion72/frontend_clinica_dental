import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { PacienteService, Paciente } from '../../services/paciente.service';
import { CitasService } from '../../services/cita.service';
import { HistoriaClinicaService } from '../../services/historia-clinica.service';
import { ProcedimientoService } from '../../services/procedimiento.service';

interface IndicadoresBase {
  totalPacientes: number;
  pacientesNuevos: number;
  totalCitas: number;
  citasPorEstado: Record<string, number>;
  citasPorDentista: Record<string, number>;
  promedioCitasPorDia: number;
}

interface IndicadoresProcedimientos {
  totalProcedimientos: number;
  procedimientosPorTipo: Record<string, number>;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
})
export class ReportesComponent implements OnInit {
  desde = '';
  hasta = '';

  cargandoBase = signal(false);
  cargandoProcedimientos = signal(false);
  progresoProcedimientos = signal(0);

  // Fuente de datos (API vs simulada)
  useMock = true;
  fuenteLabel = signal('Simulada');

  indicadoresBase: IndicadoresBase | null = null;
  indicadoresProcedimientos: IndicadoresProcedimientos | null = null;

  pacientes: Paciente[] = [];
  citas: any[] = [];
  // Datos simulados adicionales
  mockHistorias: any[] = [];
  mockProcedimientos: any[] = [];
  dentistas: any[] = [];

  constructor(
    private pacienteService: PacienteService,
    private citasService: CitasService,
    private historiaClinicaService: HistoriaClinicaService,
    private procedimientoService: ProcedimientoService
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const hace30 = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
    this.desde = this.normDate(hace30);
    this.hasta = this.normDate(hoy);
    if (this.useMock) {
      this.cargarMock();
    } else {
      this.cargarBase();
    }
  }

  async cargarBase() {
    this.cargandoBase.set(true);
    try {
      const [pacientes, citas] = await Promise.all([
        firstValueFrom(this.pacienteService.getAll()),
        firstValueFrom(this.citasService.getCitas())
      ]);
      this.pacientes = pacientes ?? [];
      this.citas = citas ?? [];
      this.indicadoresBase = this.calcularIndicadoresBase();
    } catch (e) {
      console.error('Error cargando datos base de reportes', e);
    } finally {
      this.cargandoBase.set(false);
    }
  }

  async cargarProcedimientos() {
    if (!this.pacientes?.length) return;
    this.cargandoProcedimientos.set(true);
    this.progresoProcedimientos.set(0);

    let total = 0;
    const tipoCounter: Record<string, number> = {};

    try {
      if (this.useMock) {
        // En modo simulado trabajamos con el arreglo plano
        let procesados = 0;
        const totalRegs = this.mockProcedimientos.length || 1;
        for (const proc of this.mockProcedimientos) {
          const fecha = this.parseToDate(proc.fecha ?? proc.created_at);
          if (this.enRango(fecha)) {
            total += 1;
            const tipo = (proc.trabajoRealizado || proc.nombre || 'Procedimiento').toString();
            tipoCounter[tipo] = (tipoCounter[tipo] || 0) + 1;
          }
          procesados += 1;
          if (procesados % Math.ceil(totalRegs / 100) === 0) {
            this.progresoProcedimientos.set(Math.round((procesados / totalRegs) * 100));
          }
        }
      } else {
        let procesados = 0;
        for (const p of this.pacientes) {
          // Obtiene la historia clínica por paciente
          let historia: any;
          try {
            historia = await firstValueFrom(this.historiaClinicaService.getByPacienteId(p.id));
          } catch {
            historia = null;
          }
          if (historia?.id) {
            // Obtiene procedimientos directamente por historia clínica
            let procedimientos: any[] = [];
            try {
              procedimientos = await firstValueFrom(this.procedimientoService.getByHistoriaClinicaId(historia.id));
            } catch {
              procedimientos = [];
            }

            for (const proc of procedimientos) {
              const fecha = this.parseToDate(proc.fecha ?? proc.created_at);
              if (this.enRango(fecha)) {
                total += 1;
                const tipo = (proc.trabajoRealizado || proc.nombre || 'Procedimiento').toString();
                tipoCounter[tipo] = (tipoCounter[tipo] || 0) + 1;
              }
            }
          }
          procesados += 1;
          this.progresoProcedimientos.set(Math.round((procesados / this.pacientes.length) * 100));
        }
      }

      this.indicadoresProcedimientos = {
        totalProcedimientos: total,
        procedimientosPorTipo: tipoCounter
      };
    } catch (e) {
      console.error('Error cargando procedimientos', e);
    } finally {
      this.cargandoProcedimientos.set(false);
    }
  }

  onRangoChange() {
    this.indicadoresBase = this.calcularIndicadoresBase();
    // No recarga procedimientos automáticamente para evitar sobrecarga
  }

  calcularIndicadoresBase(): IndicadoresBase {
    const desdeD = this.parseDateStr(this.desde);
    const hastaD = this.parseDateStr(this.hasta);

    // Pacientes
    const totalPacientes = this.pacientes.length;
    const pacientesNuevos = this.pacientes.filter(p => this.enRango(this.parseToDate(p.created_at))).length;

    // Citas en rango
    const citasRango = this.citas.filter(c => this.enRango(this.parseToDate(c.horarioFecha?.fecha)));
    const totalCitas = citasRango.length;

    // Citas por estado
    const citasPorEstado: Record<string, number> = {};
    for (const c of citasRango) {
      const estado = (c.estado || 'Sin estado').toString();
      citasPorEstado[estado] = (citasPorEstado[estado] || 0) + 1;
    }

    // Citas por dentista
    const citasPorDentista: Record<string, number> = {};
    for (const c of citasRango) {
      const dentistaId = c.horarioFecha?.dentista?.id ?? 'N/A';
      const key = `Dentista ${dentistaId}`;
      citasPorDentista[key] = (citasPorDentista[key] || 0) + 1;
    }

    // Promedio de citas por día
    const dias = Math.max(1, Math.ceil((hastaD.getTime() - desdeD.getTime()) / (24 * 60 * 60 * 1000)) + 1);
    const promedioCitasPorDia = +(totalCitas / dias).toFixed(2);

    return {
      totalPacientes,
      pacientesNuevos,
      totalCitas,
      citasPorEstado,
      citasPorDentista,
      promedioCitasPorDia
    };
  }

  exportCSV() {
    const rows: string[] = [];
    rows.push('Indicador,Valor');
    if (this.indicadoresBase) {
      const b = this.indicadoresBase;
      rows.push(`Total Pacientes,${b.totalPacientes}`);
      rows.push(`Pacientes Nuevos (rango),${b.pacientesNuevos}`);
      rows.push(`Total Citas (rango),${b.totalCitas}`);
      rows.push(`Promedio Citas por Día,${b.promedioCitasPorDia}`);
      for (const [estado, val] of Object.entries(b.citasPorEstado)) {
        rows.push(`Citas ${estado},${val}`);
      }
      for (const [dentista, val] of Object.entries(b.citasPorDentista)) {
        rows.push(`Citas por ${dentista},${val}`);
      }
    }
    if (this.indicadoresProcedimientos) {
      const p = this.indicadoresProcedimientos;
      rows.push(`Total Procedimientos (rango),${p.totalProcedimientos}`);
      for (const [tipo, val] of Object.entries(p.procedimientosPorTipo)) {
        rows.push(`Procedimientos ${this.sanitize(tipo)},${val}`);
      }
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reportes_${this.desde}_a_${this.hasta}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Utils
  normDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  parseDateStr(s: string): Date {
    return new Date(`${s}T00:00:00`);
  }

  parseToDate(val: any): Date {
    if (!val) return new Date('1970-01-01');
    if (typeof val === 'string') return new Date(val.includes('T') ? val : `${val}T00:00:00`);
    if (val instanceof Date) return val;
    return new Date(val);
  }

  enRango(d: Date): boolean {
    const desdeD = this.parseDateStr(this.desde);
    const hastaD = this.parseDateStr(this.hasta);
    const dateOnly = new Date(`${this.normDate(d)}T00:00:00`);
    return dateOnly.getTime() >= desdeD.getTime() && dateOnly.getTime() <= hastaD.getTime();
  }

  sanitize(text: string): string {
    return text.replace(/[\,\n\r]/g, ' ');
  }

  // ----- Modo simulado -----
  async cargarMockDesdeAssets() {
    this.cargandoBase.set(true);
    try {
      const res = await fetch('assets/reportes-mock.json');
      if (!res.ok) throw new Error('No se encontró assets/reportes-mock.json');
      const json = await res.json();
      if (json.__meta__ && (!json.pacientes || !json.citas)) {
        const gen = this.generateMockData({
          pacientes: json.__meta__.pacientes ?? 300,
          dentistas: json.__meta__.dentistas ?? 12,
          citas: json.__meta__.citas ?? 1200,
          procedimientos: json.__meta__.procedimientos ?? 1800,
          meses: json.__meta__.meses ?? 6
        });
        this.pacientes = gen.pacientes; this.citas = gen.citas;
        this.mockHistorias = gen.historiasClinicas; this.mockProcedimientos = gen.procedimientos; this.dentistas = gen.dentistas;
      } else {
        this.pacientes = json.pacientes || [];
        this.citas = json.citas || [];
        this.mockHistorias = json.historiasClinicas || [];
        this.mockProcedimientos = json.procedimientos || [];
        this.dentistas = json.dentistas || [];
      }
      this.indicadoresBase = this.calcularIndicadoresBase();
    } catch (e) {
      console.warn('Fallo al cargar assets/reportes-mock.json, generando datos en memoria...', e);
      await this.cargarMock();
    } finally {
      this.cargandoBase.set(false);
    }
  }

  async cargarMock() {
    this.cargandoBase.set(true);
    try {
      const { pacientes, citas, historiasClinicas, procedimientos, dentistas } = this.generateMockData({
        pacientes: 300,
        dentistas: 12,
        citas: 1200,
        procedimientos: 1800,
        meses: 6
      });
      this.pacientes = pacientes;
      this.citas = citas;
      this.mockHistorias = historiasClinicas;
      this.mockProcedimientos = procedimientos;
      this.dentistas = dentistas;
      this.indicadoresBase = this.calcularIndicadoresBase();
    } finally {
      this.cargandoBase.set(false);
    }
  }

  onFuenteChange(val: string) {
    this.useMock = val === 'Simulada';
    this.fuenteLabel.set(val);
    if (this.useMock) this.cargarMock(); else this.cargarBase();
  }

  descargarJSON() {
    const data = {
      pacientes: this.pacientes,
      citas: this.citas,
      historiasClinicas: this.mockHistorias,
      procedimientos: this.mockProcedimientos,
      dentistas: this.dentistas
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reportes_mock_${this.desde}_a_${this.hasta}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async onFileUpload(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      this.pacientes = json.pacientes || [];
      this.citas = json.citas || [];
      this.mockHistorias = json.historiasClinicas || [];
      this.mockProcedimientos = json.procedimientos || [];
      this.dentistas = json.dentistas || [];
      this.indicadoresBase = this.calcularIndicadoresBase();
    } catch (e) {
      console.error('Archivo JSON inválido', e);
      alert('No se pudo leer el archivo JSON. Verifica su formato.');
    }
  }

  generateMockData(opts: { pacientes: number; dentistas: number; citas: number; procedimientos: number; meses: number; }) {
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = <T>(arr: T[]) => arr[rand(0, arr.length - 1)];
    const nombres = ['Ana', 'Luis', 'María', 'Carlos', 'Sofía', 'Jorge', 'Daniela', 'Pedro', 'Valeria', 'Miguel', 'Andrea', 'José'];
    const apellidos = ['García', 'Pérez', 'Rodríguez', 'Fernández', 'López', 'Gómez', 'Díaz', 'Torres', 'Ruiz', 'Flores'];
    const especialidades = ['Ortodoncia', 'Endodoncia', 'Odontopediatría', 'Periodoncia', 'Prótesis', 'Estética'];
    const estados = ['Agendada', 'Completada', 'Cancelada', 'Reprogramada'];

    const hoy = new Date();
    const start = new Date(hoy.getTime() - opts.meses * 30 * 24 * 60 * 60 * 1000);

    // Dentistas
    const dentistas = Array.from({ length: opts.dentistas }).map((_, i) => ({
      id: i + 1,
      nombre: `${pick(nombres)} ${pick(apellidos)}`,
      especialidad: pick(especialidades)
    }));

    // Pacientes
    const pacientes: any[] = Array.from({ length: opts.pacientes }).map((_, i) => {
      const created = new Date(start.getTime() + rand(0, (hoy.getTime() - start.getTime())));
      return {
        id: i + 1,
        nombre: `${pick(nombres)} ${pick(apellidos)}`,
        celular: `7${rand(0, 9999999).toString().padStart(7, '0')}`,
        email: `p${i + 1}@example.com`,
        created_at: created.toISOString(),
        updated_at: created.toISOString(),
        estado_civil_id: 1,
        fecha_nacimiento: new Date(1980 + rand(0, 30), rand(0, 11), rand(1, 28)),
        celularSecundario: ''
      };
    });

    // Historias clínicas
    const historiasClinicas: any[] = pacientes.map((p, i) => ({
      id: i + 1,
      pacienteId: p.id,
      fechaIngreso: p.created_at,
      motivoConsulta: 'Chequeo general'
    }));

    // Citas
    const citas: any[] = Array.from({ length: opts.citas }).map((_, i) => {
      const fecha = new Date(start.getTime() + rand(0, (hoy.getTime() - start.getTime())));
      const horaInicio = `${String(rand(8, 17)).padStart(2, '0')}:00`;
      const horaFin = `${String(Math.min(18, parseInt(horaInicio) + 1)).padStart(2, '0')}:00`;
      const dentista = pick(dentistas);
      const paciente = pick(pacientes);
      return {
        id: i + 1,
        estado: pick(estados),
        consultorio: `C${rand(1, 5)}`,
        observaciones: '—',
        externalEventId: `EVT-${i + 1}`,
        paciente: { id: paciente.id, nombre: paciente.nombre, celular: paciente.celular, email: paciente.email },
        horarioFecha: {
          id: i + 1,
          fecha: fecha.toISOString(),
          horario: { horaInicio, horaFin },
          dentista: { id: dentista.id, especialidad: dentista.especialidad }
        },
        createdAt: fecha.toISOString()
      };
    });

    // Procedimientos
    const trabajos = ['Limpieza', 'Extracción', 'Endodoncia', 'Ortodoncia', 'Carillas', 'Blanqueamiento', 'Implante'];
    const procedimientos: any[] = Array.from({ length: opts.procedimientos }).map((_, i) => {
      const fecha = new Date(start.getTime() + rand(0, (hoy.getTime() - start.getTime())));
      const historia = pick(historiasClinicas);
      const dentista = pick(dentistas);
      return {
        id: i + 1,
        fecha: fecha.toISOString(),
        trabajoRealizado: pick(trabajos),
        historiaClinicaId: historia.id,
        dentistaId: dentista.id,
        created_at: fecha.toISOString()
      };
    });

    return { pacientes, dentistas, historiasClinicas, citas, procedimientos };
  }
}
