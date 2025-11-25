import { Component, EventEmitter, Input, Output, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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
export class TeethChartComponent implements OnInit, OnChanges {
  @Input() patientChart?: PatientDentalChart | null;
  @Output() toothClick = new EventEmitter<number>();
  @Output() chartSaved = new EventEmitter<PatientDentalChart>();
  @Input() scale = 0.30;
  @Input() readonly = false;
  @Input() captureId = 'odontogramCapture';

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientChart'] && this.patientChart?.layout) {
      const layout = this.patientChart.layout;
      // Filas
      if (layout.rows) {
        this.upperTeeth = layout.rows.upperFront ?? this.upperTeeth;
        this.lowerTeeth = layout.rows.lowerFront ?? this.lowerTeeth;
      }
      // Imágenes desde layout del paciente
      this.imagesFront = { ...this.imagesFront, ...(layout.images?.front ?? {}) };
      this.imagesTop = { ...this.imagesTop, ...(layout.images?.top ?? {}) };
      this.jsonFrontSet = new Set(Object.keys(layout.images?.front ?? {}).map(k => Number(k)));
      this.jsonTopSet = new Set(Object.keys(layout.images?.top ?? {}).map(k => Number(k)));
      // Offsets
      this.frontOffsets = layout.offsets?.front ?? this.frontOffsets;
      this.topOffsets = layout.offsets?.top ?? this.topOffsets;
      // Tamaños base
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
    }
  }

  svgWidth(view: 'front'|'top') { return Math.round(this.baseSizes[view].w * this.scale); }
  svgHeight(view: 'front'|'top') { return Math.round(this.baseSizes[view].h * this.scale); }

  offsetTransform(n: number, view: 'front'|'top') {
    const o = view === 'front' ? this.frontOffsets[n] : this.topOffsets[n];
    return o ? `translate(${Math.round(o.x * this.scale)}px, ${Math.round(o.y * this.scale)}px)` : '';
  }

  editingTooth: number | null = null;

  onToothClick(n: number) { 
    if (this.readonly) return;
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

  private readonly PATHOLOGY_COLOR: Record<string, string> = {
    decay: '#D32F2F',
    fracture: '#1976D2',
    toothWear: '#F57C00',
    discoloration: '#9C27B0',
    apical: '#388E3C',
    developmentDisorder: '#7B1FA2'
  }

  private nameToHex(name: string): string | null {
    const map: Record<string, string> = {
      red: '#FF0000', blue: '#1976D2', yellow: '#FFEB3B', green: '#4CAF50',
      orange: '#F57C00', gray: '#9E9E9E', black: '#000000', white: '#FFFFFF'
    }
    return map[name] || null
  }

  private alphaColor(c: string, alpha: number): string {
    const hex = c.startsWith('#') ? c : (this.nameToHex(c) || '#FF0000')
    const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  pathColorStr(n: number): string {
    const t = this.patientChart?.teeth?.[n]
    const chosen = t?.pathologyDetails?.['color']
    if (chosen) return this.nameToHex(chosen) || chosen
    if (t?.pathology && this.PATHOLOGY_COLOR[t.pathology]) return this.PATHOLOGY_COLOR[t.pathology]
    return '#FF0000'
  }

  pathStroke(n: number): string { return this.pathColorStr(n) }
  pathFill(n: number): string { return this.alphaColor(this.pathColorStr(n), 0.30) }

  // Muestra la "tinta" si hay color explícito, si hay patología o si existen shapes
  private readonly TINT_ALPHA = 0.28;
  shouldTint(n: number): boolean {
    const t = this.patientChart?.teeth?.[n]
    if (!t) return false
    const hasExplicitColor = !!t.pathologyDetails?.['color']
    const hasPathology = !!t.pathology
    const hasShapes = !!t.shapes?.front || !!t.shapes?.top
    return hasExplicitColor || hasPathology || hasShapes
  }
  tintFill(n: number): string { return this.alphaColor(this.pathColorStr(n), this.TINT_ALPHA) }

  onSaved(updatedChart: PatientDentalChart) {
    this.patientChart = updatedChart;
    this.chartSaved.emit(updatedChart);
    this.closeEditor();
  }

  // Ítems de leyenda (colores y etiquetas)
  legendItems = [
    { label: 'Caries', color: '#D32F2F' },
    { label: 'Fractura', color: '#1976D2' },
    { label: 'Exodoncia', color: '#000000' },
    { label: 'Endodoncia', color: '#FF9800' },
    { label: 'Tártaro', color: '#FFC107' },
    { label: 'Restauración', color: '#4CAF50' },
    { label: 'Pieza ausente', color: '#1E88E5', ring: true },
    { label: 'Prótesis', color: '#0D47A1' },
    { label: 'Facetas de desgaste', color: '#8D6E63' }
  ];

  // Carga html2canvas desde CDN si no está presente
  private async ensureHtml2Canvas(): Promise<any> {
    const w = window as any;
    if (w.html2canvas) return w.html2canvas;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('No se pudo cargar html2canvas'));
      document.head.appendChild(s);
    });
    return (window as any).html2canvas;
  }

  // Alternativa recomendada: html-to-image, con mejor soporte para SVG/masks
  private async ensureHtmlToImage(): Promise<any> {
    const w = window as any;
    if (w.htmlToImage) return w.htmlToImage;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/html-to-image@1.11.11/dist/html-to-image.min.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('No se pudo cargar html-to-image'));
      document.head.appendChild(s);
    });
    return (window as any).htmlToImage;
  }

  // Exporta como imagen PNG el contenedor que incluye odontograma+leyenda
  async exportImage() {
    const el = document.getElementById(this.captureId) as HTMLElement | null;
    if (!el) {
      console.error(`Contenedor ${this.captureId} no encontrado`);
      return;
    }
    const fileName = `odontograma_${new Date().toISOString().slice(0,10)}.png`;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    try {
      // Primero intentamos con html-to-image (mejor SVG support)
      const htmlToImage = await this.ensureHtmlToImage();
      const dataUrl = await htmlToImage.toPng(el, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      link.click();
      return;
    } catch (e) {
      console.warn('Fallo html-to-image, usando html2canvas como fallback:', e);
    }

    try {
      const html2canvas = await this.ensureHtml2Canvas();
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        scale: pixelRatio
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      link.click();
    } catch (e) {
      console.error('Error exportando imagen del odontograma:', e);
      alert('No se pudo generar la imagen. Revisa la consola del navegador.');
    }
  }

  // Export robusto: dibuja el odontograma a un <canvas>, respetando overlays
  async exportImageCanvas() {
    const container = document.getElementById(this.captureId) as HTMLElement | null;
    if (!container) {
      console.error(`Contenedor ${this.captureId} no encontrado`);
      return;
    }
    const rect = container.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(rect.width * pixelRatio);
    canvas.height = Math.round(rect.height * pixelRatio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const toBlob = async (): Promise<Blob> => new Promise(res => canvas.toBlob(b => res(b!), 'image/png'));

    const toothEls = Array.from(container.querySelectorAll('.tooth')) as HTMLElement[];
    // Cargar imágenes por adelantado para evitar parpadeos
    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });

    for (const el of toothEls) {
      const n = Number(el.getAttribute('data-tooth'));
      const view = (el.getAttribute('data-view') as 'front'|'top') || 'front';
      const imgEl = el.querySelector('img') as HTMLImageElement | null;
      if (!imgEl) continue;

      const b = el.getBoundingClientRect();
      const x = Math.round((b.left - rect.left) * pixelRatio);
      const y = Math.round((b.top - rect.top) * pixelRatio);
      const w = Math.round(b.width * pixelRatio);
      const h = Math.round(b.height * pixelRatio);

      try {
        const img = await loadImage(imgEl.src);
        ctx.drawImage(img, x, y, w, h);

        // Tinte general de la pieza si aplica (recortado por la silueta de la imagen)
        if (this.shouldTint(n)) {
          const overlay = document.createElement('canvas');
          overlay.width = w;
          overlay.height = h;
          const octx = overlay.getContext('2d');
          if (octx) {
            // Pintamos el color
            octx.fillStyle = this.tintFill(n);
            octx.fillRect(0, 0, w, h);
            // Recortamos usando la imagen como máscara (alpha)
            octx.globalCompositeOperation = 'destination-in';
            octx.drawImage(img, 0, 0, w, h);
            // Dibujamos el resultado sobre el canvas principal
            ctx.drawImage(overlay, x, y);
          }
        }

        // Shapes SVG convertidos a canvas con Path2D
        const pathStr = view === 'front' ? (this.patientChart?.teeth?.[n]?.shapes?.front || '')
                                         : (this.patientChart?.teeth?.[n]?.shapes?.top || '');
        if (pathStr) {
          const scaleX = w / (this.baseSizes[view].w * pixelRatio);
          const scaleY = h / (this.baseSizes[view].h * pixelRatio);
          ctx.save();
          ctx.translate(x, y);
          ctx.scale(scaleX, scaleY);
          const p = new Path2D(pathStr);
          // Relleno y borde como en SVG
          ctx.fillStyle = this.pathFill(n);
          ctx.strokeStyle = this.pathStroke(n);
          ctx.lineWidth = 2; // coincide con stroke-width="2"
          ctx.fill(p);
          ctx.stroke(p);
          ctx.restore();
        }
      } catch (e) {
        console.warn('No se pudo dibujar la pieza', n, e);
      }
    }

    // Descargar
    const blob = await toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `odontograma_${new Date().toISOString().slice(0,10)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
