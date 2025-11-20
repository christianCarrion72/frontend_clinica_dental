import { Component, EventEmitter, Output, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ToothEditorStateService } from '../../state.service'

@Component({
  selector: 'app-action-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-buttons.component.html',
  styleUrls: ['./action-buttons.component.css']
})
export class ActionButtonsComponent {
  s = inject(ToothEditorStateService)
  @Output() save = new EventEmitter<void>()
}