/** Utilidades geométricas del lienzo: sin dependencias de React ni del DOM. */

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, '').slice(0, 12)

export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

/** Longitudes acumuladas de una polilínea, para recorrerla a velocidad constante. */
function cumulativeLengths(points) {
  const acc = [0]
  for (let i = 1; i < points.length; i += 1) {
    acc.push(acc[i - 1] + distance(points[i - 1], points[i]))
  }
  return acc
}

/** Punto situado a la fracción `t` (0..1) del recorrido de una polilínea. */
export function pointAlong(points, t) {
  if (!points || points.length === 0) return null
  if (points.length === 1) return points[0]

  const acc = cumulativeLengths(points)
  const total = acc[acc.length - 1]
  if (total === 0) return points[0]

  const target = Math.max(0, Math.min(1, t)) * total
  for (let i = 1; i < points.length; i += 1) {
    if (acc[i] >= target) {
      const segment = acc[i] - acc[i - 1] || 1
      const k = (target - acc[i - 1]) / segment
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * k,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * k,
      }
    }
  }
  return points[points.length - 1]
}

/** Path SVG ondulado (conducción): senoidal a lo largo del vector, plano al final. */
export function wavyPath(from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  if (length < 8) return `M${from.x},${from.y} L${to.x},${to.y}`

  const ux = dx / length
  const uy = dy / length
  const nx = -uy
  const ny = ux

  const amplitude = 7
  const wavelength = 26
  const flatTail = 18

  const points = []
  for (let d = 0; d <= length; d += 3) {
    const wave = d > length - flatTail ? 0 : Math.sin((d / wavelength) * Math.PI * 2) * amplitude
    points.push(`${(from.x + ux * d + nx * wave).toFixed(1)},${(from.y + uy * d + ny * wave).toFixed(1)}`)
  }
  return `M${points.join(' L')}`
}

export const polylinePath = (points) => `M${points.map((p) => `${p.x},${p.y}`).join(' L')}`

/**
 * Rectángulo que ve el navegador (el `viewBox` del SVG) para una superficie.
 * Sin giro es el propio rectángulo del campo; girado un cuarto de vuelta a la
 * izquierda, el largo del campo pasa a ser el alto de la pantalla.
 */
export function viewBoxOf(surface) {
  if (surface.rotate === -90) {
    return { x: surface.y, y: -(surface.x + surface.w), w: surface.h, h: surface.w }
  }
  return { x: surface.x, y: surface.y, w: surface.w, h: surface.h }
}

/** Convierte coordenadas de puntero a coordenadas de pizarra. */
export function toBoardPoint(event, svgElement, surface) {
  const rect = svgElement.getBoundingClientRect()
  const fx = (event.clientX - rect.left) / rect.width
  const fy = (event.clientY - rect.top) / rect.height
  if (surface.rotate === -90) {
    return { x: surface.x + surface.w * (1 - fy), y: surface.y + surface.h * fx }
  }
  return { x: surface.x + surface.w * fx, y: surface.y + surface.h * fy }
}
