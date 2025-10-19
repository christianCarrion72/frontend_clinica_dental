import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CitasService } from '../../services/cita.service';

interface Cita {
  id: number;
  estado: string;
  consultorio: string;
  observaciones: string;
  externalEventId: string;
  paciente: {
    id: number;
    nombre: string;
    celular: string;
    email: string;
  };
  horarioFecha: {
    id: number;
    fecha: string;
    horario: {
      horaInicio: string;
      horaFin: string;
    };
    dentista: {
      id: number;
      especialidad: string;
    };
  };
  createdAt: string;
}

interface Paciente {
  id: number;
  nombre: string;
  celular: string;
  email: string;
}

interface HorarioFecha {
  id: number;
  fecha: string;
  disponible: boolean;
  horario: {
    id: number;
    horaInicio: string;
    horaFin: string;
  };
  dentista: {
    id: number;
    especialidad: string;
  };
}

@Component({
  selector: 'app-cita-dia',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './cita-dia.component.html',
  styleUrl: './cita-dia.component.css'
})
export class CitaDiaComponent implements OnInit {
  fecha: string = '';
  fechaFormateada: string = '';
  citas: Cita[] = [];
  pacientes: Paciente[] = [];
  horariosDisponibles: HorarioFecha[] = [];
  especialidades: string[] = [];
  especialidadSeleccionada: string = '';
  
  showFormulario: boolean = false;
  editandoCita: Cita | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Formulario
  formulario = {
    pacienteId: '',
    horarioFechaId: '',
    consultorio: 'Consultorio 1',
    estado: 'programada',
    observaciones: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private citasService: CitasService
  ) {}

  ngOnInit(): void {
    // Obtener fecha de los parámetros
    this.route.queryParams.subscribe(params => {
      this.fecha = params['fecha'];
      if (this.fecha) {
        this.fechaFormateada = this.formatearFecha(this.fecha);
        this.loadDatos();
      }
    });
  }

  formatearFecha(fecha: string): string {
    const [year, month, day] = fecha.split('-');
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const diaSemana = diasSemana[d.getDay()];
    const nombreMes = meses[parseInt(month) - 1];
    
    return `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)}, ${day} de ${nombreMes} de ${year}`;
  }

  loadDatos(): void {
    this.isLoading = true;
    
    // Cargar citas del día
    this.citasService.getCitas().subscribe({
      next: (citas) => {
        this.citas = this.citasService.getCitasPorFecha(this.fecha, citas);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
        this.errorMessage = 'Error al cargar las citas';
        this.isLoading = false;
      }
    });

    // Cargar pacientes
    this.citasService.getPacientes().subscribe({
      next: (pacientes) => {
        this.pacientes = pacientes;
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
      }
    });

    // Cargar horarios disponibles para esta fecha
    this.citasService.getHorariosFechasDisponiblesPorFecha(this.fecha).subscribe({
      next: (horarios) => {
        this.horariosDisponibles = horarios;
        // Extraer especialidades únicas
        this.especialidades = Array.from(
          new Set(horarios.map(h => h.dentista.especialidad))
        ).sort();
        // Seleccionar la primera especialidad por defecto si no hay ninguna seleccionada
        if (this.especialidades.length > 0 && !this.especialidadSeleccionada) {
          this.especialidadSeleccionada = '';
        }
      },
      error: (error) => {
        console.error('Error al cargar horarios:', error);
        this.errorMessage = 'Error al cargar horarios disponibles';
      }
    });
  }

  // Obtener horarios filtrados por especialidad seleccionada
  getHorariosFiltrados(): HorarioFecha[] {
    if (!this.especialidadSeleccionada) {
      return this.horariosDisponibles;
    }
    return this.horariosDisponibles.filter(h => 
      h.dentista.especialidad === this.especialidadSeleccionada
    );
  }

  onEspecialidadChange(): void {
    this.formulario.horarioFechaId = '';
  }

  abrirFormulario(): void {
    this.editandoCita = null;
    this.formulario = {
      pacienteId: '',
      horarioFechaId: '',
      consultorio: 'Consultorio 1',
      estado: 'programada',
      observaciones: ''
    };
    this.especialidadSeleccionada = '';
    this.showFormulario = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  editarCita(cita: Cita): void {
    this.editandoCita = cita;
    this.formulario = {
      pacienteId: cita.paciente.id.toString(),
      horarioFechaId: cita.horarioFecha.id.toString(),
      consultorio: cita.consultorio,
      estado: cita.estado,
      observaciones: cita.observaciones
    };
    // Establecer la especialidad del dentista actual
    this.especialidadSeleccionada = cita.horarioFecha.dentista.especialidad;
    this.showFormulario = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  guardarCita(): void {
    if (!this.formulario.pacienteId || !this.formulario.horarioFechaId) {
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const citaData = {
      pacienteId: parseInt(this.formulario.pacienteId),
      horarioFechaId: parseInt(this.formulario.horarioFechaId),
      consultorio: this.formulario.consultorio,
      estado: this.formulario.estado,
      observaciones: this.formulario.observaciones
    };

    if (this.editandoCita) {
      // Actualizar cita
      this.citasService.updateCita(this.editandoCita.id, citaData).subscribe({
        next: () => {
          this.successMessage = 'Cita actualizada correctamente';
          this.isLoading = false;
          this.showFormulario = false;
          this.loadDatos();
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (error) => {
          console.error('Error al actualizar cita:', error);
          this.errorMessage = error.error?.message || 'Error al actualizar la cita';
          this.isLoading = false;
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    } else {
      // Crear cita
      this.citasService.createCita(citaData).subscribe({
        next: () => {
          this.successMessage = 'Cita creada correctamente';
          this.isLoading = false;
          this.showFormulario = false;
          this.loadDatos();
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (error) => {
          console.error('Error al crear cita:', error);
          this.errorMessage = error.error?.message || 'Error al crear la cita';
          this.isLoading = false;
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }

  eliminarCita(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
      this.isLoading = true;
      this.citasService.deleteCita(id).subscribe({
        next: () => {
          this.successMessage = 'Cita eliminada correctamente';
          this.isLoading = false;
          this.loadDatos();
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (error) => {
          console.error('Error al eliminar cita:', error);
          this.errorMessage = 'Error al eliminar la cita';
          this.isLoading = false;
          setTimeout(() => this.errorMessage = '', 5000);
        }
      });
    }
  }

  cancelarFormulario(): void {
    this.showFormulario = false;
    this.editandoCita = null;
    this.especialidadSeleccionada = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  volver(): void {
    this.router.navigate(['/citas']);
  }

  getColorForState(estado: string): string {
    switch(estado) {
      case 'programada': return 'bg-blue-500';
      case 'completada': return 'bg-green-500';
      case 'cancelada': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }
}