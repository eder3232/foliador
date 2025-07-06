'use client'

import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

import { useSelector } from '@xstate/react'
import { OrchestratorMachineContext } from '../context/MachineProvider'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Importar react-pdf dinámicamente solo en el cliente
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  {
    ssr: false,
    loading: () => <p>Cargando visor PDF...</p>,
  }
)

const Page = dynamic(() => import('react-pdf').then((mod) => mod.Page), {
  ssr: false,
})

export const PdfPreview = () => {
  const state = OrchestratorMachineContext.useSelector((s) => s)
  const file = state.context.file

  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Configurar worker de PDF.js
    import('react-pdf').then((mod) => {
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`
    })
  }, [])

  if (!isClient) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Previsualización PDF</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">Cargando visor PDF...</p>
        </CardContent>
      </Card>
    )
  }

  if (!file) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Previsualización PDF</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">
            No hay archivo PDF cargado.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Previsualización PDF</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <Document
          file={file}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<p>Cargando PDF...</p>}
          error={<p>No se pudo cargar el PDF.</p>}
        >
          <Page pageNumber={pageNumber} width={350} />
        </Document>
        {numPages && numPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 border rounded"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
            >
              Anterior
            </button>
            <span>
              Página {pageNumber} de {numPages}
            </span>
            <button
              className="px-2 py-1 border rounded"
              onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
            >
              Siguiente
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
