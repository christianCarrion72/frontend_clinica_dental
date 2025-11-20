import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ToothEditorStateService } from '../../state.service'

const zones = [
  { value: '1', label: 'Cervical Buccal', area: 'cervical1' },
  { value: '2', label: 'Buccal', area: 'direction1' },
  { value: '3', label: 'Mesial', area: 'direction2' },
  { value: '4', label: 'Incisal', area: 'direction3' },
  { value: '5', label: 'Distal', area: 'direction4' },
  { value: '6', label: 'Palatal', area: 'direction5' },
  { value: '7', label: 'Cervical Palatal', area: 'cervical2' },
  { value: '8', label: 'Class 4 Mesial', area: 'cusp1' },
  { value: '9', label: 'Class 4 Distal', area: 'cusp2' },
  { value: '10', label: 'Buccal Surface', area: 'cusp3' },
  { value: '11', label: 'Palatal Surface', area: 'cusp4' },
]

@Component({
  selector: 'app-zones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './zones.component.html',
  styleUrls: ['./zones.component.css']
})
export class ZonesComponent {
  s = inject(ToothEditorStateService)
  list = zones
  get activate() { return this.s.selectedPathology()==='decay' }
}