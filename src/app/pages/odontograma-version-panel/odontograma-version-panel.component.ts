import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OdontogramaVersionService, OdontrogramaVersion } from '../../services/odontograma-version.service';
import { TeethChartComponent } from '../teeth-chart/teeth-chart.component';
import { PatientDentalChart } from '../../shared/dental-chart.types';

@Component({
  selector: 'app-odontograma-version-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TeethChartComponent],
  templateUrl: './odontograma-version-panel.component.html',
  styleUrl: './odontograma-version-panel.component.css'
})
export class OdontogramaVersionPanelComponent implements OnChanges {
  @Input() odontogramaId?: number;
  @Input() json?: any;

  nombreVersion = '';
  versions: OdontrogramaVersion[] = [];
  loading = false;
  saving = false;
  error?: string;
  success?: string;

  // Vista previa de una versión seleccionada
  selectedVersion?: OdontrogramaVersion;
  selectedChart?: PatientDentalChart | null;

  constructor(private versionApi: OdontogramaVersionService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['odontogramaId'] && this.odontogramaId) {
      this.loadVersions();
    }
  }

  loadVersions() {
    if (!this.odontogramaId) return;
    this.loading = true;
    this.error = undefined;
    this.versionApi.findAll().subscribe({
      next: (all) => {
        this.versions = all.filter(v => v.odontograma?.id === this.odontogramaId);
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar el historial de versiones';
        this.loading = false;
      }
    });
  }

  saveVersion() {
    this.error = undefined;
    this.success = undefined;

    if (!this.odontogramaId) {
      this.error = 'No se encontró el ID del odontograma';
      return;
    }
    if (!this.json) {
      this.error = 'No hay JSON del odontograma para versionar';
      return;
    }

    const nombre = this.nombreVersion?.trim();
    const nombreFinal = nombre && nombre.length > 0 ? nombre : `Versión ${new Date().toLocaleString()}`;

    this.saving = true;
    this.versionApi.create(this.odontogramaId, nombreFinal, this.json).subscribe({
      next: (created) => {
        this.versions = [...this.versions, created];
        this.success = 'Versión guardada correctamente';
        this.nombreVersion = '';
        this.saving = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo guardar la versión';
        this.saving = false;
      }
    });
  }

  refresh() {
    this.loadVersions();
  }

  selectVersion(v: OdontrogramaVersion) {
    this.selectedVersion = v;
    this.selectedChart = this.mapVersionToChart(v);
  }

  closePreview() {
    this.selectedVersion = undefined;
    this.selectedChart = null;
  }

  private mapVersionToChart(v: OdontrogramaVersion): PatientDentalChart {
    const layout = v.json ?? {};
    const teeth = layout?.teeth ?? {};
    return {
      patientId: String(v.odontograma?.id ?? this.odontogramaId ?? ''),
      teeth,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      layout,
      layoutName: 'version',
      layoutVersion: 1,
      version: v.id
    };
  }
}
