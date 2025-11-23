import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toothImagesFrontView, toothImagesTopView } from '../../shared/tooth-images';
import { ToothEditorComponent } from '../tooth-editor/tooth-editor.component';
import { PatientDentalChart } from '../../shared/dental-chart.types';
import { ToothEditorStateService } from '../tooth-editor/state.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-teeth-chart',
  standalone: true,
  imports: [CommonModule, ToothEditorComponent],
  templateUrl: './teeth-chart.component.html',
  styleUrls: ['./teeth-chart.component.css']
})
export class TeethChartComponent implements OnInit {
  @Input() patientChart?: PatientDentalChart | null;
  @Output() toothClick = new EventEmitter<number>();
  @Input() scale = 0.30;

  // Filas (cargadas desde JSON)
  upperTeeth = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
  lowerTeeth = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

  // Imágenes (JSON → fallback a toothImages* si falta)
  // Fallbacks públicos para el template y estado inicial
  public toothImagesFrontView = toothImagesFrontView;
  public toothImagesTopView = toothImagesTopView;

  // Imágenes con fallback por defecto
  imagesFront: Record<number, string> = { ...toothImagesFrontView };
  imagesTop: Record<number, string> = { ...toothImagesTopView };

  // Offsets opcionales
  frontOffsets: Record<number, {x:number;y:number}> = {};
  topOffsets: Record<number, {x:number;y:number}> = {};

  private baseSizes = {
    front: { w: 122, h: 380 },
    top: { w: 121, h: 172 }
  };

  editorState = inject(ToothEditorStateService);
  private http = inject(HttpClient);

  // Sets para rastrear qué piezas vienen del JSON
  jsonFrontSet = new Set<number>();
  jsonTopSet = new Set<number>();

  // Centraliza la obtención del src de imagen
  getImageSrc(n: number, view: 'front'|'top') {
    return view === 'front'
      ? (this.imagesFront[n] || this.toothImagesFrontView[n])
      : (this.imagesTop[n] || this.toothImagesTopView[n]);
  }

  // Origen para inspección en DevTools
  getOrigin(n: number, view: 'front'|'top') {
    return view === 'front'
      ? (this.jsonFrontSet.has(n) ? 'json' : 'fallback')
      : (this.jsonTopSet.has(n) ? 'json' : 'fallback');
  }

  ngOnInit(): void {
    this.http.get<any>('assets/odontogram-layout.json').subscribe({
      next: (layout) => {
        // Filas desde JSON (si existen)
        if (layout.rows) {
          this.upperTeeth = layout.rows.upperFront ?? this.upperTeeth;
          this.lowerTeeth = layout.rows.lowerFront ?? this.lowerTeeth;
        }

        // Mezcla imágenes del JSON sobre los fallbacks
        this.imagesFront = { ...this.imagesFront, ...(layout.images?.front ?? {}) };
        this.imagesTop = { ...this.imagesTop, ...(layout.images?.top ?? {}) };

        // Marca qué piezas llegaron desde el JSON
        this.jsonFrontSet = new Set(Object.keys(layout.images?.front ?? {}).map(k => Number(k)));
        this.jsonTopSet = new Set(Object.keys(layout.images?.top ?? {}).map(k => Number(k)));

        // Log para confirmar carga desde JSON
        console.log('[Odontogram JSON] front keys:', this.jsonFrontSet.size, 'top keys:', this.jsonTopSet.size);

        // Offsets
        this.frontOffsets = layout.offsets?.front ?? this.frontOffsets;
        this.topOffsets = layout.offsets?.top ?? this.topOffsets;

        // Tamaños base: width/height → w/h
        if (layout.meta?.front && layout.meta?.top) {
          this.baseSizes.front = {
            w: layout.meta.front.width ?? this.baseSizes.front.w,
            h: layout.meta.front.height ?? this.baseSizes.front.h,
          };
          this.baseSizes.top = {
            w: layout.meta.top.width ?? this.baseSizes.top.w,
            h: layout.meta.top.height ?? this.baseSizes.top.h,
          };
        }
      },
      error: (err) => console.error('Error cargando assets/odontogram-layout.json', err),
    });
  }

  svgWidth(view: 'front'|'top') { return Math.round(this.baseSizes[view].w * this.scale); }
  svgHeight(view: 'front'|'top') { return Math.round(this.baseSizes[view].h * this.scale); }

  offsetTransform(n: number, view: 'front'|'top') {
    const o = view === 'front' ? this.frontOffsets[n] : this.topOffsets[n];
    return o ? `translate(${Math.round(o.x * this.scale)}px, ${Math.round(o.y * this.scale)}px)` : '';
  }

  editingTooth: number | null = null;

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