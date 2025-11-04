import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
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

@Component({
  selector: 'app-citas',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './citas.component.html',
  styleUrl: './citas.component.css'
})
export class CitasComponent implements OnInit {
  currentMonth: Date = new Date();
  daysInMonth: (number | null)[] = [];
  monthName: string = '';
  year: number = new Date().getFullYear();
  month: number = new Date().getMonth();

  citas: Cita[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(private citasService: CitasService, private router: Router) {}

  ngOnInit(): void {
    this.generateCalendar();
    this.loadCitas();
  }

  generateCalendar(): void {
    const firstDay = new Date(this.year, this.month, 1);
    const lastDay = new Date(this.year, this.month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    this.daysInMonth = [];
    const weekCount = Math.ceil((lastDay.getDate() + firstDay.getDay()) / 7);

    for (let i = 0; i < weekCount * 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      if (currentDate.getMonth() === this.month) {
        this.daysInMonth.push(currentDate.getDate());
      } else {
        this.daysInMonth.push(null);
      }
    }

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    this.monthName = `${monthNames[this.month]} ${this.year}`;
  }

  previousMonth(): void {
    this.month--;
    if (this.month < 0) {
      this.month = 11;
      this.year--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    this.month++;
    if (this.month > 11) {
      this.month = 0;
      this.year++;
    }
    this.generateCalendar();
  }

  formatDateYYYYMMDD(year: number, month: number, day: number): string {
    const d = new Date(year, month, day);
    const year2 = d.getFullYear();
    const month2 = String(d.getMonth() + 1).padStart(2, '0');
    const day2 = String(d.getDate()).padStart(2, '0');
    return `${year2}-${month2}-${day2}`;
  }

  selectDate(day: number | null): void {
    if (day === null) return;

    const selectedDate = new Date(this.year, this.month, day);
    const fechaStr = this.formatDateYYYYMMDD(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    // Navegar a la página de detalle del día
    this.router.navigate(['/cita-dia'], { queryParams: { fecha: fechaStr } });
  }

  loadCitas(): void {
    this.isLoading = true;
    this.citasService.getCitas().subscribe({
      next: (data) => {
        this.citas = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
        this.errorMessage = 'Error al cargar las citas';
        this.isLoading = false;
      }
    });
  }

  getCitasCountForDay(day: number): number {
    if (!day) return 0;
    const dateStr = this.formatDateYYYYMMDD(this.year, this.month, day);
    return this.citasService.contarCitasPorFecha(dateStr, this.citas);
  }

  getCitasForDay(day: number): Cita[] {
    if (!day) return [];
    const dateStr = this.formatDateYYYYMMDD(this.year, this.month, day);
    return this.citasService.getCitasParaCalendario(dateStr, this.citas);
  }

  getColorForState(estado: string): string {
    switch(estado) {
      case 'programada': return 'bg-blue-500';
      case 'completada': return 'bg-green-500';
      case 'cancelada': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           this.month === today.getMonth() && 
           this.year === today.getFullYear();
  }

  volverDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}