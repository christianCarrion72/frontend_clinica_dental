import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ToothEditorStateService } from '../../state.service'

@Component({
  selector: 'app-zones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './zones.component.html',
  styleUrls: ['./zones.component.css']
})
export class ZonesComponent {
  s = inject(ToothEditorStateService)
  list = [
    { value: '1', label: 'Cervical Vestibular', area: 'cervical1' },
    { value: '2', label: 'Vestibular', area: 'direction1' },
    { value: '3', label: 'Mesial', area: 'direction2' },
    { value: '4', label: 'Incisal', area: 'direction3' },
    { value: '5', label: 'Distal', area: 'direction4' },
    { value: '6', label: 'Palatino', area: 'direction5' },
    { value: '7', label: 'Cervical Palatino', area: 'cervical2' },
    { value: '8', label: 'Clase IV Mesial', area: 'cusp1' },
    { value: '9', label: 'Clase IV Distal', area: 'cusp2' },
    { value: '10', label: 'Superficie Vestibular', area: 'cusp3' },
    { value: '11', label: 'Superficie Palatina', area: 'cusp4' },
  ]
  get activate() { return this.s.selectedPathology()==='decay' }
}