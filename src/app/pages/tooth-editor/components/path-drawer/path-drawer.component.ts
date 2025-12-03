import { Component, inject, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ToothEditorStateService } from '../../state.service'

@Component({
  selector: 'app-path-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './path-drawer.component.html',
  styleUrls: ['./path-drawer.component.css']
})
export class PathDrawerComponent {
  @Input() readonly = false
  s = inject(ToothEditorStateService)
  get activePath() { return this.s.activeView()==='front' ? this.s.frontSvgPath() : this.s.topSvgPath() }
  get canUndo() {
    return this.s.activeView()==='front'
      ? (this.s.frontPoints().length>0 && !this.s.frontClosed())
      : (this.s.topPoints().length>0 && !this.s.topClosed())
  }
  get canClose() {
    return this.s.activeView()==='front'
      ? (this.s.frontPoints().length>2 && !this.s.frontClosed())
      : (this.s.topPoints().length>2 && !this.s.topClosed())
  }
}
