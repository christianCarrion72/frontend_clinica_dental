export function isWithinBounds(point: {x:number;y:number}, view: 'front'|'top') {
  return view === 'front'
    ? point.x >= 0 && point.x <= 122 && point.y >= 0 && point.y <= 380
    : point.x >= 0 && point.x <= 121 && point.y >= 0 && point.y <= 172
}
export function getGroupX(view: 'front'|'top') {
  return view === 'front' ? (322 - 122) / 2 : (172 - 121) / 2
}
export function adjustPoint(point: {x:number;y:number}, groupX: number) {
  return { x: point.x - groupX, y: point.y }
}