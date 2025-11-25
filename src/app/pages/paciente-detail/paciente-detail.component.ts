import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { OdontogramaService, OdontogramaEntity } from '../../services/odontograma.service';
import { TeethChartComponent } from '../teeth-chart/teeth-chart.component';
import { PatientDentalChart } from '../../shared/dental-chart.types';

@Component({
  selector: 'app-paciente-detail',
  standalone: true,
  imports: [CommonModule, TeethChartComponent],
  templateUrl: './paciente-detail.component.html',
  styleUrl: './paciente-detail.component.css'
})
export class PacienteDetailComponent implements OnInit {
  @Input() pacienteId?: number;

  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private odontogramaApi = inject(OdontogramaService);

  loading = true;
  error?: string;

  odontograma?: OdontogramaEntity;
  patientChart?: PatientDentalChart;

  ngOnInit() {
    const idFromInput = this.pacienteId;
    const idFromRouteStr = this.route.snapshot.paramMap.get('id');
    const idFromRoute = idFromRouteStr ? Number(idFromRouteStr) : NaN;
    const id = idFromInput ?? idFromRoute;

    if (!id || Number.isNaN(id)) {
      this.loading = false;
      this.error = 'No se encontró el ID del paciente';
      return;
    }

    this.pacienteId = id;

    this.odontogramaApi.getByPacienteId(id).subscribe({
      next: (existing) => {
        if (existing) {
          this.odontograma = existing;
          this.patientChart = this.mapToChart(existing.json, id);
          this.loading = false;
        } else {
          // Primera vez: cargar layout y crear
          this.http.get<any>('assets/odontogram-layout.json').subscribe({
            next: (layout) => {
              this.odontogramaApi.create(id, layout).subscribe({
                next: (created) => {
                  this.odontograma = created;
                  this.patientChart = this.mapToChart(created.json, id);
                  this.loading = false;
                },
                error: (err) => {
                  this.error = 'Error creando el odontograma';
                  console.error(err);
                  this.loading = false;
                }
              });
            },
            error: (err) => {
              this.error = 'No se pudo cargar el layout base';
              console.error(err);
              this.loading = false;
            }
          });
        }
      },
      error: (err) => {
        this.error = 'Error consultando el odontograma';
        console.error(err);
        this.loading = false;
      }
    });
  }

  private mapToChart(json: any, patientId: number): PatientDentalChart {
    return {
      patientId: String(patientId),
      patientName: undefined,
      teeth: json?.teeth ?? {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      layout: json,       // El layout base (con images/rows/offsets)
      layoutName: 'default',
      layoutVersion: 1,
      version: undefined
    };
  }

  // Agrega este método para manejar el guardado del odontograma
  persistChart(chart: PatientDentalChart) {
    const id = this.pacienteId;
    if (!this.odontograma || !this.patientChart || !id) {
      this.error = 'No se encontró el odontograma para guardar';
      return;
    }
    const nextLayout = { ...(this.patientChart.layout || {}), teeth: chart.teeth };
    this.odontogramaApi.update(this.odontograma.id, nextLayout).subscribe({
      next: (updated) => {
        this.odontograma = updated;
        this.patientChart = this.mapToChart(updated.json, id);
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo guardar el odontograma';
      }
    });
  }
}