/**
 * Contraseñas propuestas por el sistema.
 *
 * Se buscan fáciles de leer y de dictar por teléfono: sílabas pronunciables y
 * unos dígitos al final. Sin letras que se confunden (l/1, o/0) y sin palabras
 * con significado, para que no sean adivinables.
 */

const CONSONANTS = 'bcdfgjkmnprstvz'
const VOWELS = 'aeiu'

/** Números aleatorios del navegador, no `Math.random`. */
function pick(alphabet) {
  const values = new Uint32Array(1)
  window.crypto.getRandomValues(values)
  return alphabet[values[0] % alphabet.length]
}

export function generatePassword() {
  let word = ''
  for (let index = 0; index < 4; index += 1) {
    word += pick(CONSONANTS) + pick(VOWELS)
  }
  let digits = ''
  for (let index = 0; index < 3; index += 1) {
    digits += pick('23456789')
  }
  return `${word}-${digits}`
}
