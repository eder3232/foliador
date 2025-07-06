'use client'

import { ConfigurationPanel } from './components/ConfigurationPanel'
import { FileUpload } from './components/FileUpload'
import { OrchestratorMachineContext } from './context/MachineProvider'
import { PdfPreview } from './components/PreviewPdf'
import { firmarPdf } from './utils/pdf-foliador'

const Page = () => {
  const state = OrchestratorMachineContext.useSelector((s) => s)
  const actorRef = OrchestratorMachineContext.useActorRef()
  const send = actorRef.send

  console.log('state', state.context.error)

  const handleDownload = async () => {
    if (!state.context.file) return

    try {
      const config = state.context.configManager?.getSnapshot().context
      if (!config) {
        console.error('No hay configuración disponible')
        return
      }

      const signedPdf = await firmarPdf(state.context.file, config)

      // Crear blob y descargar
      const blob = new Blob([signedPdf], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'pdf-foliado.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error al firmar PDF:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      {/* Estado: idle o uploading: solo carga de archivo */}
      {(state.matches('idle') || state.matches('uploading')) && <FileUpload />}

      {/* Estado: configurando, ready: mostrar panel de configuración */}
      {(state.matches('configuring') || state.matches('ready')) && (
        <ConfigurationPanel />
      )}

      {/* Previsualización PDF si hay archivo */}
      {(state.matches('configuring') || state.matches('ready')) && (
        <PdfPreview />
      )}

      {/* Estado: ready: mostrar botón para descargar */}
      {state.matches('ready') && (
        <button
          className="w-full py-2 px-4 bg-green-600 text-white rounded"
          onClick={handleDownload}
        >
          Descargar PDF foliado
        </button>
      )}

      {/* Mostrar el estado y contexto para depuración */}
      <div className="bg-gray-100 rounded p-4 text-xs">
        <strong>Estado actual:</strong> {String(state.value)}
        <pre>{JSON.stringify(state.context, null, 2)}</pre>
      </div>

      {/* mostrar la maquina de estado completa */}
      <div className="bg-gray-100 rounded p-4 text-xs">
        <strong>Máquina de estado completa:</strong>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </div>
    </div>
  )
}

export default Page
