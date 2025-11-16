import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toothImagesFrontView, toothImagesTopView } from '../../shared/tooth-images';
import { ToothEditorComponent } from '../tooth-editor/tooth-editor.component';
import { PatientDentalChart } from '../../shared/dental-chart.types';
import { ToothEditorStateService } from '../tooth-editor/state.service';

@Component({
  selector: 'app-teeth-chart',
  standalone: true,
  imports: [CommonModule, ToothEditorComponent],
  templateUrl: './teeth-chart.component.html',
  styleUrls: ['./teeth-chart.component.css']
})
export class TeethChartComponent {
  @Input() patientChart?: PatientDentalChart | null;
  @Output() toothClick = new EventEmitter<number>();
  @Input() scale = 0.30;

  toothImagesFrontView = toothImagesFrontView;
  toothImagesTopView = toothImagesTopView;

  upperTeeth = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
  lowerTeeth = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

  private baseSizes = {
    front: { w: 122, h: 380 },
    top: { w: 121, h: 172 }
  };

  svgWidth(view: 'front'|'top') { return Math.round(this.baseSizes[view].w * this.scale); }
  svgHeight(view: 'front'|'top') { return Math.round(this.baseSizes[view].h * this.scale); }

  editingTooth: number | null = null;
  editorState = inject(ToothEditorStateService);

  onToothClick(n: number) { 
    console.log('Tooth clicked:', n); // Para debugging
    this.toothClick.emit(n); 
    this.loadToothData(n);
    this.editingTooth = n; 
  }

  loadToothData(toothNumber: number) {
    // Resetear el estado primero
    this.editorState.selectedPathology.set('');
    this.editorState.pathologyDetails.set({});
    this.editorState.selectedZones.set([]);
    this.editorState.frontPoints.set([]);
    this.editorState.topPoints.set([]);
    this.editorState.frontClosed.set(false);
    this.editorState.topClosed.set(false);
    this.editorState.frontSvgPath.set('');
    this.editorState.topSvgPath.set('');

    // Cargar datos existentes si los hay
    if (this.patientChart?.teeth?.[toothNumber]) {
      const tooth = this.patientChart.teeth[toothNumber];
      
      // Cargar los paths SVG existentes
      if (tooth.shapes?.front) {
        this.editorState.frontSvgPath.set(tooth.shapes.front);
        this.editorState.frontClosed.set(true);
      }
      if (tooth.shapes?.top) {
        this.editorState.topSvgPath.set(tooth.shapes.top);
        this.editorState.topClosed.set(true);
      }

      // Cargar patología y detalles
      if (tooth.pathology) {
        this.editorState.selectedPathology.set(tooth.pathology);
      }
      if (tooth.pathologyDetails) {
        this.editorState.pathologyDetails.set(tooth.pathologyDetails);
      }
      if (tooth.zones) {
        this.editorState.selectedZones.set(tooth.zones);
      }
    }
  }

  closeEditor() { 
    this.editingTooth = null; 
  }

  onSaved(updatedChart: PatientDentalChart) {
    this.patientChart = updatedChart;
    this.closeEditor();
  }
}