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
    { label: 'CARIES', value: 'decay' },
    { label: 'FRACTURA', value: 'fracture' },
    { label: 'DESGASTE DENTAL', value: 'toothWear' },
    { label: 'DISCOLORACIÓN', value: 'discoloration' },
    { label: 'APICAL', value: 'apical' },
    { label: 'TRASTORNO DEL DESARROLLO', value: 'developmentDisorder' }
  ]
}