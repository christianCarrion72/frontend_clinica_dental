import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ToothEditorStateService } from '../../state.service'

@Component({
  selector: 'app-pathology-types',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pathology-types.component.html',
  styleUrls: ['./pathology-types.component.css']
})
export class PathologyTypesComponent {
  s = inject(ToothEditorStateService)
  types = [
    { label: 'DECAY', value: 'decay' },
    { label: 'FRACTURE', value: 'fracture' },
    { label: 'TOOTH WEAR', value: 'toothWear' },
    { label: 'DISCOLORATION', value: 'discoloration' },
    { label: 'APICAL', value: 'apical' },
    { label: 'DEVELOPMENT DISORDER', value: 'developmentDisorder' }
  ]
}