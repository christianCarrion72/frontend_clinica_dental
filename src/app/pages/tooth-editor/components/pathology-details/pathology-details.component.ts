import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { pathologyOptions } from '../pathology-types/pathology-options'
import { ToothEditorStateService } from '../../state.service'

@Component({
  selector: 'app-pathology-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pathology-details.component.html',
  styleUrls: ['./pathology-details.component.css']
})
export class PathologyDetailsComponent {
  s = inject(ToothEditorStateService)

  get hierarchy(): Record<string, { options: { label: string; value: string; next?: Record<string, any> }[] } | { label: string; value: string; next?: Record<string, any> }[]> | null {
    const sel = this.s.selectedPathology()
    if (!sel) return null
    return (pathologyOptions as Record<string, any>)[sel] ?? null
  }

  isSelectedMulti(field: string, value: string): boolean {
    const current = this.s.pathologyDetails()[field] || []
    return Array.isArray(current) && current.includes(value)
  }

  toggleMulti(field: string, value: string): void {
    const current = this.s.pathologyDetails()[field] || []
    const next = this.isSelectedMulti(field, value)
      ? (current as string[]).filter(v => v !== value)
      : [ ...(current as string[]), value ]
    this.s.updateDetail(field, next)
  }

  isSelectedSingle(field: string, value: string): boolean {
    const current = this.s.pathologyDetails()[field] || ''
    return current === value
  }

  toggleSingle(field: string, value: string): void {
    const current = this.s.pathologyDetails()[field] || ''
    const next = current === value ? '' : value
    this.s.updateDetail(field, next)
  }
}