import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HorariosService } from '../../services/horarios.service';
interface Horario {
  id: number;
  horaInicio: string;
  horaFin: string;
}

interface Dentista {
  id: number;
  nombre: string;
}

interface Asignacion {
  id: number;
  dentista: Dentista;
  horarios: Horario[];
  dentistaId?: number; // ID real del dentista (no del usuario)
}

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios.component.html',
  styleUrl: './horarios.component.css'
})
export class HorariosComponent implements OnInit {
  horariosDisponibles: Horario[] = [];
  dentistas: Dentista[] = [];
  asignaciones: Asignacion[] = [];
  
  fecha: string = '';
  dentistaSeleccionado: number | null = null;
  horariosSeleccionados: number[] = [];
  
  generando: boolean = false;
  agregandoAsignacion: boolean = false;
  cargandoDatos: boolean = true;
  resultado: {
    exitosos: number;
    fallidos: number;
    detalles: Array<{
      dentista: string;
      horario: string;
      status: 'exitoso' | 'fallido';
      error?: string;
    }>;
  } | null = null;

  constructor(private horariosService: HorariosService) {}

  ngOnInit() {
    this.cargarDatos();
  }

  async cargarDatos() {
    this.cargandoDatos = true;
    try {
      await Promise.all([
        this.cargarHorarios(),
        this.cargarDentistas()
      ]);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
    } finally {
      this.cargandoDatos = false;
    }
  }

  async cargarHorarios() {
    try {
      this.horariosDisponibles = await this.horariosService.getHorarios().toPromise() || [];
      console.log('Horarios cargados:', this.horariosDisponibles.length);
    } catch (error) {
      console.error('Error cargando horarios:', error);
      alert('Error al cargar los horarios. Por favor, recarga la página.');
    }
  }

  async cargarDentistas() {
    try {
      const usuarios = await this.horariosService.getUsuarios().toPromise() || [];
      this.dentistas = this.horariosService.getDentistas(usuarios);
      console.log('Dentistas cargados:', this.dentistas.length);
    } catch (error) {
      console.error('Error cargando dentistas:', error);
      alert('Error al cargar los dentistas. Por favor, recarga la página.');
    }
  }

  toggleHorario(horarioId: number) {
    const index = this.horariosSeleccionados.indexOf(horarioId);
    if (index > -1) {
      this.horariosSeleccionados.splice(index, 1);
    } else {
      this.horariosSeleccionados.push(horarioId);
    }
  }

  isHorarioSeleccionado(horarioId: number): boolean {
    return this.horariosSeleccionados.includes(horarioId);
  }

  async agregarAsignacion() {
    if (!this.dentistaSeleccionado || this.horariosSeleccionados.length === 0) {
      alert('Debes seleccionar un dentista y al menos un horario');
      return;
    }

    console.log('=== INICIO AGREGAR ASIGNACIÓN ===');
    console.log('ID seleccionado:', this.dentistaSeleccionado);
    console.log('Dentistas disponibles:', this.dentistas);

    const dentista = this.dentistas.find(d => d.id === this.dentistaSeleccionado);
    console.log('Dentista encontrado:', dentista);
    
    if (!dentista) {
      alert('Dentista no encontrado en la lista local');
      return;
    }

    const horarios = this.horariosDisponibles.filter(h => 
      this.horariosSeleccionados.includes(h.id)
    );

    if (horarios.length === 0) {
      alert('No se encontraron horarios seleccionados');
      return;
    }

    // Validar que el usuario sea realmente un dentista obteniendo su ID
    this.agregandoAsignacion = true;
    try {
      console.log(`Validando dentista con usuario ID: ${dentista.id}`);
      const dentistaId = await this.horariosService.getDentistaIdFromUserId(dentista.id);
      console.log(`✓ Dentista validado. ID de dentista: ${dentistaId}`);

      this.asignaciones.push({
        id: Date.now(),
        dentista,
        horarios,
        dentistaId // Guardar el ID real del dentista
      });

      console.log('✓ Asignación agregada exitosamente');
      console.log('=== FIN AGREGAR ASIGNACIÓN ===');

      // Limpiar selección
      this.dentistaSeleccionado = null;
      this.horariosSeleccionados = [];
    } catch (error: any) {
      console.error('❌ Error validando dentista:', error);
      console.error('Error completo:', JSON.stringify(error, null, 2));
      alert(`Error: El usuario seleccionado no es un dentista válido.\n${error.message || 'Error desconocido'}`);
    } finally {
      this.agregandoAsignacion = false;
    }
  }

  eliminarAsignacion(id: number) {
    this.asignaciones = this.asignaciones.filter(a => a.id !== id);
  }

  formatearHora(hora: string): string {
    return this.horariosService.formatearHora(hora);
  }

  async generarHorariosFechas() {
    if (!this.fecha) {
      alert('Debes seleccionar una fecha');
      return;
    }

    if (this.asignaciones.length === 0) {
      alert('Debes agregar al menos una asignación');
      return;
    }

    // Confirmar acción
    const totalHorarios = this.asignaciones.reduce((sum, a) => sum + a.horarios.length, 0);
    const confirmar = confirm(
      `¿Estás seguro de generar ${totalHorarios} horarios para ${this.asignaciones.length} dentista(s) en la fecha ${this.fecha}?`
    );
    
    if (!confirmar) return;

    this.generando = true;
    this.resultado = null;

    try {
      // Usar el método optimizado que ya tiene los IDs reales
      this.resultado = await this.generarHorariosConIDsReales();

      // Mostrar resumen
      if (this.resultado.fallidos === 0) {
        alert(`✅ ¡Generación exitosa! Se crearon ${this.resultado.exitosos} horarios.`);
        // Limpiar asignaciones después del éxito
        this.asignaciones = [];
        this.fecha = '';
      } else {
        alert(
          `⚠️ Generación completada con errores:\n` +
          `✅ Exitosos: ${this.resultado.exitosos}\n` +
          `❌ Fallidos: ${this.resultado.fallidos}\n\n` +
          `Revisa los detalles más abajo.`
        );
      }
    } catch (error) {
      console.error('Error en la generación masiva:', error);
      alert('Error durante la generación. Por favor, intenta nuevamente.');
    } finally {
      this.generando = false;
    }
  }

  /**
   * Genera horarios usando los IDs de dentista ya validados
   */
  private async generarHorariosConIDsReales(): Promise<{
    exitosos: number;
    fallidos: number;
    detalles: Array<{
      dentista: string;
      horario: string;
      status: 'exitoso' | 'fallido';
      error?: string;
    }>;
  }> {
    const resultado = {
      exitosos: 0,
      fallidos: 0,
      detalles: [] as Array<{
        dentista: string;
        horario: string;
        status: 'exitoso' | 'fallido';
        error?: string;
      }>
    };

    for (const asignacion of this.asignaciones) {
      for (const horario of asignacion.horarios) {
        try {
          const dto = {
            fecha: this.fecha,
            disponible: true,
            horarioId: horario.id,
            dentistaId: asignacion.dentistaId! // Usar el ID ya validado
          };

          console.log('Creando horario-fecha:', dto);
          await this.horariosService.createHorarioFecha(dto).toPromise();

          resultado.exitosos++;
          resultado.detalles.push({
            dentista: asignacion.dentista.nombre,
            horario: `${this.formatearHora(horario.horaInicio)} - ${this.formatearHora(horario.horaFin)}`,
            status: 'exitoso'
          });
        } catch (error: any) {
          console.error('Error creando horario-fecha:', error);
          resultado.fallidos++;
          resultado.detalles.push({
            dentista: asignacion.dentista.nombre,
            horario: `${this.formatearHora(horario.horaInicio)} - ${this.formatearHora(horario.horaFin)}`,
            status: 'fallido',
            error: error.error?.message || error.message || 'Error desconocido'
          });
        }
      }
    }

    return resultado;
  }

  limpiarResultados() {
    this.resultado = null;
  }

  limpiarTodo() {
    if (this.asignaciones.length > 0) {
      const confirmar = confirm('¿Estás seguro de limpiar todas las asignaciones?');
      if (!confirmar) return;
    }
    
    this.asignaciones = [];
    this.fecha = '';
    this.dentistaSeleccionado = null;
    this.horariosSeleccionados = [];
    this.resultado = null;
  }

  // Métodos auxiliares para la vista
  getTotalHorariosAsignados(): number {
    return this.asignaciones.reduce((sum, a) => sum + a.horarios.length, 0);
  }

  getDentistasAsignados(): string[] {
    return this.asignaciones.map(a => a.dentista.nombre);
  }

  getTipoDato(valor: any): string {
    return typeof valor;
  }
}