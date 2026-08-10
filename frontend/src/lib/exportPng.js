/** Exporta el SVG del lienzo a PNG usando un canvas fuera de pantalla. */

import { SURFACES } from './constants.js'

const SCALE = 1.4

const slugify = (value) =>
  (value || 'pizarra')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'pizarra'

export function exportSvgToPng(svgElement, { surface = 'full', filename } = {}) {
  return new Promise((resolve, reject) => {
    if (!svgElement) {
      reject(new Error('No hay lienzo que exportar'))
      return
    }

    const view = SURFACES[surface] ?? SURFACES.full
    const clone = svgElement.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const markup = new XMLSerializer().serializeToString(clone)

    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = view.w * SCALE
      canvas.height = view.h * SCALE
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)

      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${slugify(filename)}.png`
      link.click()
      resolve()
    }
    image.onerror = () => reject(new Error('No se ha podido generar la imagen en este navegador'))
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
  })
}
