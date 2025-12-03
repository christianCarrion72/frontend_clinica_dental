import { Injectable, signal } from '@angular/core'

type View = 'front'|'top'
interface Point { x:number; y:number }

@Injectable({ providedIn: 'root' })
export class ToothEditorStateService {
  selectedPathology = signal<string>('')
  pathologyDetails = signal<Record<string, any>>({})
  selectedZones = signal<string[]>([])

  activeView = signal<View>('front')
  isDrawing = signal<boolean>(false)

  frontPoints = signal<Point[]>([])
  topPoints = signal<Point[]>([])
  frontClosed = signal<boolean>(false)
  topClosed = signal<boolean>(false)
  frontSvgPath = signal<string>('')
  topSvgPath = signal<string>('')

  setView(v: View) { this.activeView.set(v) }
  startDrawing() { this.isDrawing.set(true) }
  reset() {
    if (this.activeView() === 'front') {
      this.frontPoints.set([])
      this.frontClosed.set(false)
      this.frontSvgPath.set('')
    } else {
      this.topPoints.set([])
      this.topClosed.set(false)
      this.topSvgPath.set('')
    }
    this.isDrawing.set(true)
  }
  copyPath() {
    const p = this.activeView() === 'front' ? this.frontSvgPath() : this.topSvgPath()
    if (!p) return
    navigator.clipboard?.writeText(p)
  }
  stopDrawing() {
    this.isDrawing.set(false)
  }
  closePath() {
    const v = this.activeView()
    if (v === 'front') {
      const pts = this.frontPoints()
      if (!pts.length || this.frontClosed()) return
      this.frontClosed.set(true)
      this.updateSvgPath(pts, true, 'front')
    } else {
      const pts = this.topPoints()
      if (!pts.length || this.topClosed()) return
      this.topClosed.set(true)
      this.updateSvgPath(pts, true, 'top')
    }
  }
  undo() {
    if (this.activeView() === 'front') {
      const arr = this.frontPoints().slice(0, -1)
      this.frontPoints.set(arr)
      this.updateSvgPath(arr, false, 'front')
    } else {
      const arr = this.topPoints().slice(0, -1)
      this.topPoints.set(arr)
      this.updateSvgPath(arr, false, 'top')
    }
  }

  updateSvgPath(points: Point[], closed: boolean, view: View) {
    if (!points.length) {
      view === 'front' ? this.frontSvgPath.set('') : this.topSvgPath.set('')
      return
    }
    let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} `
    for (let i = 1; i < points.length; i++) {
      path += `L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)} `
    }
    if (closed) path += 'Z'
    ;(view === 'front' ? this.frontSvgPath : this.topSvgPath).set(path.trim())
  }

  togglePathology(p: string) {
    this.selectedPathology.set(this.selectedPathology() === p ? '' : p)
    this.pathologyDetails.set({})
    this.selectedZones.set([])
  }
  updateDetail(k: string, v: any) {
    const d = { ...this.pathologyDetails() }
    d[k] = v
    this.pathologyDetails.set(d)
  }
  toggleZone(z: string) {
    const arr = this.selectedZones()
    const next = arr.includes(z) ? arr.filter(x => x !== z) : [...arr, z]
    this.selectedZones.set(next)
  }
}
