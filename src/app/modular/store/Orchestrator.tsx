import { ActorRefFrom, setup, assign } from 'xstate'
import { fileManagerMachine } from './FileManager'
import { configManagerMachine } from './ConfigManager'
import { previewManagerMachine } from './PreviewManager'
import { pdfProcessorMachine } from './Processor'

interface PdfFolioOrchestratorContext {
  file: File | null
  processedPdf: Uint8Array | null
  error: string | null
  fileManager: ActorRefFrom<typeof fileManagerMachine> | null
  configManager: ActorRefFrom<typeof configManagerMachine> | null
  previewManager: ActorRefFrom<typeof previewManagerMachine> | null
  processor: ActorRefFrom<typeof pdfProcessorMachine> | null
}

type PdfFolioOrchestratorEvents =
  | { type: 'fileManager.UPLOAD_FILE'; file: File }
  | { type: 'fileManager.VALIDATE' }
  | { type: 'fileManager.CLEAR_ERROR' }
  | { type: 'fileManager.VALIDATION_ERROR'; error: string }
  | { type: 'configManager.UPDATE_CONFIG'; config: any }
  | { type: 'previewManager.GENERATE_PREVIEW' }
  | { type: 'START_PROCESS' }
  | { type: 'RESET' }
  | { type: 'DOWNLOAD' }

// Máquina coordinadora principal
export const pdfFolioOrchestrator = setup({
  types: {
    context: {} as PdfFolioOrchestratorContext,
    events: {} as PdfFolioOrchestratorEvents,
  },
  actors: {
    fileManager: fileManagerMachine,
    configManager: configManagerMachine,
    previewManager: previewManagerMachine,
    processor: pdfProcessorMachine,
  },
  actions: {
    setFile: assign({
      file: ({ event }) =>
        event.type === 'fileManager.UPLOAD_FILE' ? event.file : null,
    }),
    setProcessedPdf: assign({
      processedPdf: ({ event }) => {
        if ('output' in event) {
          return event.output as Uint8Array
        }
        return null
      },
    }),
    downloadPdf: ({ context }) => {
      // Lógica para descargar el PDF
      console.log('Descargando PDF:', context.processedPdf)
    },
    resetAll: assign({
      file: null,
      processedPdf: null,
      error: null,
    }),
    uploadFile: ({ context, event }) => {
      if (event.type === 'fileManager.UPLOAD_FILE') {
        context.fileManager?.send({
          type: 'UPLOAD_FILE',
          file: event.file,
        })
      }
    },
    updateConfig: ({ context, event }) => {
      if (event.type === 'configManager.UPDATE_CONFIG') {
        // Manejar reset
        if (event.config.reset) {
          context.configManager?.send({ type: 'RESET_CONFIG' })
          return
        }

        // Actualizar posición si se proporciona y no está vacío
        if (
          event.config.position &&
          Object.keys(event.config.position).length > 0
        ) {
          context.configManager?.send({
            type: 'UPDATE_POSITION',
            config: event.config.position,
          })
        }

        // Actualizar apariencia si se proporciona y no está vacío
        if (
          event.config.appearance &&
          Object.keys(event.config.appearance).length > 0
        ) {
          context.configManager?.send({
            type: 'UPDATE_APPEARANCE',
            config: event.config.appearance,
          })
        }

        // Actualizar numeración si se proporciona y no está vacío
        if (
          event.config.numbering &&
          Object.keys(event.config.numbering).length > 0
        ) {
          context.configManager?.send({
            type: 'UPDATE_NUMBERING',
            config: event.config.numbering,
          })
        }
      }
    },
    generatePreview: ({ context, event }) => {
      if (event.type === 'previewManager.GENERATE_PREVIEW' && context.file) {
        context.previewManager?.send({
          type: 'GENERATE_PREVIEW',
          file: context.file,
          config: context.configManager?.getSnapshot().context,
        })
      }
    },
  },
  guards: {
    isFileReady: ({ context }) => {
      const ready = context.fileManager?.getSnapshot().matches('ready') ?? false

      return ready
    },
    isConfigReady: ({ context }) => {
      return context.configManager?.getSnapshot().matches('ready') ?? false
    },
    isPreviewReady: ({ context }) => {
      return context.previewManager?.getSnapshot().matches('ready') ?? false
    },
    hasFile: ({ context }) => {
      return context.file !== null
    },
  },
}).createMachine({
  id: 'pdfFolioOrchestrator',
  initial: 'idle',
  context: ({ spawn }) => ({
    file: null,
    processedPdf: null,
    error: null,
    fileManager: spawn('fileManager'),
    configManager: spawn('configManager'),
    previewManager: spawn('previewManager'),
    processor: spawn('processor'),
  }),
  states: {
    idle: {
      on: {
        'fileManager.UPLOAD_FILE': {
          target: 'uploading',
          actions: ['setFile', 'uploadFile'],
        },
      },
    },
    uploading: {
      on: {
        'fileManager.UPLOAD_FILE': {
          actions: ['setFile', 'uploadFile'],
        },
      },
      always: [
        {
          guard: 'isFileReady',
          target: 'configuring',
        },
      ],
    },
    configuring: {
      on: {
        'configManager.UPDATE_CONFIG': {
          actions: ['updateConfig'],
        },
        'previewManager.GENERATE_PREVIEW': {
          target: 'previewing',
          actions: ['generatePreview'],
        },
      },
      always: [
        {
          guard: 'isConfigReady',
          target: 'previewing',
        },
      ],
    },
    previewing: {
      on: {
        'configManager.UPDATE_CONFIG': {
          target: 'configuring',
          actions: ['updateConfig'],
        },
        'previewManager.GENERATE_PREVIEW': {
          actions: ['generatePreview'],
        },
      },
      always: [
        {
          guard: 'isPreviewReady',
          target: 'ready',
        },
      ],
    },
    ready: {
      on: {
        START_PROCESS: {
          target: 'processing',
          guard: 'hasFile',
        },
        'configManager.UPDATE_CONFIG': {
          target: 'configuring',
          actions: ['updateConfig'],
        },
      },
    },
    processing: {
      invoke: {
        src: 'processor',
        input: ({ context }) => ({
          file: context.file!,
          config: context.configManager?.getSnapshot().context,
        }),
        onDone: {
          target: 'completed',
          actions: ['setProcessedPdf'],
        },
        onError: {
          target: 'ready',
          actions: assign({
            error: ({ event }) =>
              (event.error as Error)?.message || 'Error procesando PDF',
          }),
        },
      },
      on: {
        RESET: {
          target: 'idle',
          actions: ['resetAll'],
        },
      },
    },
    completed: {
      on: {
        DOWNLOAD: { actions: 'downloadPdf' },
        RESET: { target: 'idle', actions: 'resetAll' },
      },
    },
  },
})
