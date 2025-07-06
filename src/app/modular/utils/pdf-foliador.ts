import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'
import numerosEnLetras from './numeros-en-letras'

interface ConfigManagerContext {
  // Posicionamiento
  cornerVertical: 'top' | 'bottom'
  cornerHorizontal: 'left' | 'right'
  positionX: number
  positionY: number
  rotation: number
  randomnessX: number
  randomnessY: number
  randomnessRotation: number
  // Apariencia
  color: string
  transparency: number
  fontSize: number
  // Numeración
  startNumber: number
  direction: 'first' | 'last'
  numberingType: 'numbers' | 'letters' | 'mixed'
  zeroPadding: number
}

/**
 * Firma un PDF agregando numeración en cada página según la configuración.
 * @param file Archivo PDF original (File o Uint8Array)
 * @param config Configuración completa del ConfigManager
 * @returns Uint8Array del PDF firmado
 */
export async function firmarPdf(
  file: File | Uint8Array,
  config: ConfigManagerContext
): Promise<Uint8Array> {
  console.log('config', config)

  // Leer el archivo como Uint8Array si es File
  let pdfBytes: Uint8Array
  if (file instanceof File) {
    pdfBytes = new Uint8Array(await file.arrayBuffer())
  } else {
    pdfBytes = file
  }

  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pages = pdfDoc.getPages()
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Convertir color hex a rgb
  const rgbColor = hexToRgb(config.color)

  // Calcular transparencia (0-1)
  const alpha = (100 - config.transparency) / 100

  // Determinar orden de páginas según dirección
  const pageIndices =
    config.direction === 'first'
      ? pages.map((_, i) => i)
      : pages.map((_, i) => pages.length - 1 - i)

  // Generar números de folio
  const folioNumbers = generateFolioNumbers(
    config.startNumber,
    pages.length,
    config.numberingType,
    config.zeroPadding
  )

  // Separaciones fijas en centímetros (convertir a puntos: 1cm = 28.35 puntos)
  const BASE_SEPARATION_X = 4 * 28.35 // 4cm horizontal desde la esquina
  const BASE_SEPARATION_Y = 3 * 28.35 // 3cm vertical desde la esquina

  for (let i = 0; i < pages.length; i++) {
    const page = pages[pageIndices[i]]
    const pageWidth = page.getWidth()
    const pageHeight = page.getHeight()

    // Calcular posición base según esquina con separación fija
    let baseX: number
    let baseY: number

    // Aplicar separación base según la esquina seleccionada
    if (config.cornerVertical === 'top') {
      baseY = pageHeight - BASE_SEPARATION_Y
    } else {
      baseY = BASE_SEPARATION_Y
    }

    if (config.cornerHorizontal === 'left') {
      baseX = BASE_SEPARATION_X
    } else {
      baseX = pageWidth - BASE_SEPARATION_X
    }

    // Aplicar ajustes adicionales de posición (en centímetros)
    const adjustmentX = config.positionX * 28.35 // Convertir cm a puntos
    const adjustmentY = config.positionY * 28.35 // Convertir cm a puntos

    // Aplicar aleatoriedad (en centímetros)
    const randomX = (Math.random() - 0.5) * config.randomnessX * 28.35 // Convertir cm a puntos
    const randomY = (Math.random() - 0.5) * config.randomnessY * 28.35 // Convertir cm a puntos
    const randomRotation = (Math.random() - 0.5) * config.randomnessRotation // Ya está en grados

    const finalX = baseX + adjustmentX + randomX
    const finalY = baseY + adjustmentY + randomY
    const finalRotation = config.rotation + randomRotation

    // CÓDIGO ORIGINAL COMENTADO PARA DEBUG
    // Dibujar el número de folio
    if (config.numberingType === 'mixed') {
      // Para mixed: dibujar número arriba y letra abajo, ambos centrados
      const currentNumber = config.startNumber + i
      const numberText = currentNumber
        .toString()
        .padStart(config.zeroPadding, '0')
      const letterText = numberToLetters(currentNumber)

      // Número arriba
      page.drawText(numberText, {
        x: finalX,
        y: finalY + config.fontSize * 0.5, // Un poco arriba
        size: config.fontSize,
        font,
        color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
        opacity: 1, //alpha,
        rotate: degrees(finalRotation),
      })

      // Letra abajo
      page.drawText(letterText, {
        x: finalX,
        y: finalY - config.fontSize * 0.5, // Un poco abajo
        size: config.fontSize,
        font,
        color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
        opacity: 1, //alpha,
        rotate: degrees(finalRotation),
      })
    } else {
      // Para numbers y letters: dibujar solo un texto
      page.drawText(folioNumbers[i], {
        x: finalX,
        y: finalY,
        size: config.fontSize,
        font,
        color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
        opacity: 1, //alpha,
        rotate: degrees(finalRotation),
      })
    }

    // DEBUG: Texto rojo gigante en el centro
    // page.drawText(folioNumbers[i], {
    //   x: pageWidth / 2 - 100,
    //   y: pageHeight / 2,
    //   size: 100,
    //   font,
    //   color: rgb(1, 0, 0), // Rojo brillante
    //   opacity: 1,
    //   rotate: degrees(0),
    // })
  }

  const signedPdfBytes = await pdfDoc.save()
  return signedPdfBytes
}

// Utilidad para convertir color hex a rgb (0-1)
function hexToRgb(hex: string) {
  const match = hex.replace('#', '').match(/.{1,2}/g)
  if (!match) return { r: 0, g: 0, b: 0 }
  const [r, g, b] = match.map((x) => parseInt(x, 16) / 255)
  return { r, g, b }
}

// Generar números de folio según el tipo
function generateFolioNumbers(
  startNumber: number,
  totalPages: number,
  numberingType: 'numbers' | 'letters' | 'mixed',
  zeroPadding: number
): string[] {
  const numbers: string[] = []

  for (let i = 0; i < totalPages; i++) {
    const currentNumber = startNumber + i
    let folioText = ''

    switch (numberingType) {
      case 'numbers':
        folioText = currentNumber.toString().padStart(zeroPadding, '0')
        break
      case 'letters':
        folioText = numberToLetters(currentNumber)
        break
      case 'mixed':
        folioText =
          i % 2 === 0
            ? currentNumber.toString().padStart(zeroPadding, '0')
            : numberToLetters(currentNumber)
        break
    }

    numbers.push(folioText)
  }

  return numbers
}

// Convertir número a letras usando el archivo numeros-en-letras
function numberToLetters(num: number): string {
  if (num in numerosEnLetras) {
    return numerosEnLetras[num as keyof typeof numerosEnLetras]
  }
  return '' // Retorna string vacío si el número no está en el rango (0-500)
}
