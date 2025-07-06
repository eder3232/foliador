import { ActorRefFrom, setup, assign } from 'xstate'
import { fileManagerMachine } from './FileManager'
import { configManagerMachine } from './ConfigManager'

interface PdfFolioOrchestratorContext {
  file: File | null
  error: string | null
  fileManager: ActorRefFrom<typeof fileManagerMachine> | null
  configManager: ActorRefFrom<typeof configManagerMachine> | null
}

type PdfFolioOrchestratorEvents =
  | { type: 'fileManager.UPLOAD_FILE'; file: File }
  | { type: 'fileManager.VALIDATE' }
  | { type: 'fileManager.CLEAR_ERROR' }
  | { type: 'fileManager.VALIDATION_ERROR'; error: string }
  | { type: 'configManager.UPDATE_CONFIG'; config: any }
  | { type: 'RESET' }

// Máquina coordinadora principal
export const pdfFolioOrchestrator = setup({
  types: {
    context: {} as PdfFolioOrchestratorContext,
    events: {} as PdfFolioOrchestratorEvents,
  },
  actors: {
    fileManager: fileManagerMachine,
    configManager: configManagerMachine,
  },
  actions: {
    setFile: assign({
      file: ({ event }) =>
        event.type === 'fileManager.UPLOAD_FILE' ? event.file : null,
    }),
    resetAll: assign({
      file: null,
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
  },
  guards: {
    isFileReady: ({ context }) => {
      const ready = context.fileManager?.getSnapshot().matches('ready') ?? false
      return ready
    },
    isConfigReady: ({ context }) => {
      return context.configManager?.getSnapshot().matches('ready') ?? false
    },
  },
}).createMachine({
  id: 'pdfFolioOrchestrator',
  initial: 'idle',
  context: ({ spawn }) => ({
    file: null,
    error: null,
    fileManager: spawn('fileManager'),
    configManager: spawn('configManager'),
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
      },
      always: [
        {
          guard: 'isConfigReady',
          target: 'ready',
        },
      ],
    },
    ready: {
      on: {
        'configManager.UPDATE_CONFIG': {
          target: 'configuring',
          actions: ['updateConfig'],
        },
        RESET: {
          target: 'idle',
          actions: ['resetAll'],
        },
      },
    },
  },
})
