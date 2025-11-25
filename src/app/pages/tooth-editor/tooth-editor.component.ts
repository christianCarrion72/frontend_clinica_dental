import { Component, Input, Output, EventEmitter, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { toothImagesFrontView, toothImagesTopView } from '../../shared/tooth-images'
import { ToothEditorStateService } from './state.service'
import { PathologyTypesComponent } from './components/pathology-types/pathology-types.component'
import { PathologyDetailsComponent } from './components/pathology-details/pathology-details.component'
import { ActionButtonsComponent } from './components/action-buttoms/action-buttons.component'
import { ZonesComponent } from './components/zones/zones.component'
import { PathDrawerComponent } from './components/path-drawer/path-drawer.component'
import { CanvasViewComponent } from './components/canvas-view/canvas-view.component'
import { PatientDentalChart } from '../../shared/dental-chart.types'
import { DentalChartService } from '../../shared/dental-chart.service'

@Component({
  selector: 'app-tooth-editor',
  standalone: true,
  imports: [CommonModule, PathologyTypesComponent, PathologyDetailsComponent, ActionButtonsComponent, ZonesComponent, PathDrawerComponent, CanvasViewComponent],
  templateUrl: './tooth-editor.component.html',
  styleUrls: ['./tooth-editor.component.css']
})
export class ToothEditorComponent {
  @Input() patientChart!: PatientDentalChart
  @Input() toothNumber!: number
  @Output() close = new EventEmitter<void>()
  @Output() saved = new EventEmitter<PatientDentalChart>()

  s = inject(ToothEditorStateService)
  service = inject(DentalChartService)

  get frontImage() { return toothImagesFrontView[this.toothNumber] }
  get topImage() { return toothImagesTopView[this.toothNumber] }

  handleDrawFront(p: {x:number;y:number}) {
    const arr = [...this.s.frontPoints(), p]
    this.s.frontPoints.set(arr)
    this.s.updateSvgPath(arr, false, 'front')
  }
  handleDrawTop(p: {x:number;y:number}) {
    const arr = [...this.s.topPoints(), p]
    this.s.topPoints.set(arr)
    this.s.updateSvgPath(arr, false, 'top')
  }

  save() {
    const partial = {
      shapes: {
        front: this.s.frontSvgPath(),
        top: this.s.topSvgPath(),
      },
      pathology: this.s.selectedPathology(),
      pathologyDetails: this.s.pathologyDetails(),
      zones: this.s.selectedZones(),
    }
    const updated = this.service.updateTooth(this.patientChart, this.toothNumber, partial)
    this.saved.emit(updated)
  }
}