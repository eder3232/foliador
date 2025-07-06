'use client'

import { FileUpload } from './components/FileUpload'
import { ConfigurationPanel } from './components/ConfigurationPanel'
import { useSelector } from '@xstate/react'
import { useOrchestrator } from './context/MachineProvider'
import type { StateFrom } from 'xstate'
import { pdfFolioOrchestrator } from './store/Orchestrator'

const Page = () => {
  const actor = useOrchestrator()
  const state = useSelector(actor, (s) => s) as StateFrom<
    typeof pdfFolioOrchestrator
  >
  const send = actor.send

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      {/* Estado: idle o uploading: solo carga de archivo */}
      {(state.matches('idle') || state.matches('uploading')) && <FileUpload />}

      {/* Estado: configurando, previewing, ready, processing, completed: mostrar panel de configuración */}
      {(state.matches('configuring') ||
        state.matches('previewing') ||
        state.matches('ready') ||
        state.matches('processing') ||
        state.matches('completed')) && <ConfigurationPanel />}

      {/* Estado: ready o completed: mostrar botón para procesar o descargar */}
      {state.matches('ready') && (
        <button
          className="w-full py-2 px-4 bg-primary text-white rounded"
          onClick={() => send({ type: 'START_PROCESS' })}
        >
          Procesar PDF
        </button>
      )}
      {state.matches('completed') && (
        <button
          className="w-full py-2 px-4 bg-green-600 text-white rounded"
          onClick={() => send({ type: 'DOWNLOAD' })}
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
