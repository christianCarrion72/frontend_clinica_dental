import { Component, Input, Output, EventEmitter } from '@angular/core'
import { CommonModule } from '@angular/common'
import { getGroupX, isWithinBounds } from './canvas-helpers';

type View = 'front'|'top'
interface Point { x:number; y:number }

@Component({
  selector: 'app-canvas-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-view.component.html',
  styleUrls: ['./canvas-view.component.css']
})
export class CanvasViewComponent {
  @Input() view: View = 'front'
  @Input() width = 322
  @Input() height = 380
  @Input() imageSrc = ''
  @Input() shapes: { type:string; data:string; fill?:string; stroke?:string; strokeWidth?:number }[] = []
  @Input() points: Point[] = []
  @Input() isPathClosed = false
  @Input() isDrawing = false
  @Input() activeView: View = 'front'
  @Input() pathData = ''
  @Input() readonly = false
  @Output() drawPoint = new EventEmitter<Point>()

  get groupX() { return getGroupX(this.view) }
  get imgWidth() { return this.view === 'front' ? 122 : 121 }

  // Devuelve la cadena "x,y x,y ..." para el atributo points del polyline
  get polylinePoints(): string {
    return this.points.length
      ? this.points.map(p => `${p.x},${p.y}`).join(' ')
      : ''
  }

  onSvgClick(e: MouseEvent) {
    if (this.readonly) return;
    // Sólo aceptar clicks si esta vista está activa
    if (this.activeView !== this.view) return;
    if (!this.isDrawing) return;
    // Usar currentTarget para tomar el <svg> real, evitando hijos como <image>/<g>
    const svg = e.currentTarget as SVGSVGElement | null;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const adjusted = { x: x - this.groupX, y };
    if (!isWithinBounds(adjusted, this.view)) return;
    this.drawPoint.emit(adjusted);
  }
}
