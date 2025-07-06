import { assign, fromPromise, setup } from 'xstate'

export const pdfProcessorMachine = setup({
  types: {
    context: {} as {
      progress: number
      error: string | null
      processedPdf: Uint8Array | null
      file: File | null
      config: any | null
    },
    events: {} as
      | { type: 'START_PROCESSING'; file: File; config: any }
      | { type: 'CANCEL_PROCESSING' }
      | { type: 'UPDATE_PROGRESS'; progress: number }
      | { type: 'PROCESSING_ERROR'; error: string },
  },
  actors: {
    processPdf: fromPromise(
      async ({ input }: { input: { file: File; config: any } }) => {
        // Procesar PDF completo con pdf-lib
        // Aplicar folios a todas las páginas
        await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulación
        return new Uint8Array(5000) // PDF procesado
      }
    ),
  },
  actions: {
    setProgress: assign({
      progress: ({ event }) => {
        if (event.type === 'UPDATE_PROGRESS') {
          return event.progress
        }
        return 0
      },
    }),
    setError: assign({
      error: ({ event }) => {
        if (event.type === 'PROCESSING_ERROR') {
          return event.error
        }
        return null
      },
    }),
    setProcessedPdf: assign({
      processedPdf: ({ event }) => {
        if ('output' in event) {
          return event.output as Uint8Array
        }
        return null
      },
    }),
    saveFileAndConfig: assign({
      file: ({ event }) =>
        event.type === 'START_PROCESSING' ? event.file : null,
      config: ({ event }) =>
        event.type === 'START_PROCESSING' ? event.config : null,
    }),
  },
}).createMachine({
  id: 'pdfProcessor',
  initial: 'idle',
  context: {
    progress: 0,
    error: null,
    processedPdf: null,
    file: null,
    config: null,
  },
  states: {
    idle: {
      on: {
        START_PROCESSING: {
          target: 'processing',
          actions: ['saveFileAndConfig'],
        },
      },
    },
    processing: {
      invoke: {
        src: 'processPdf',
        input: ({ context }) => ({
          file: context.file!,
          config: context.config!,
        }),
        onDone: {
          target: 'completed',
          actions: ['setProcessedPdf'],
        },
        onError: {
          target: 'error',
          actions: ['setError'],
        },
      },
      on: {
        CANCEL_PROCESSING: {
          target: 'idle',
        },
      },
    },
    completed: {
      type: 'final',
    },
    error: {
      on: {
        START_PROCESSING: {
          target: 'processing',
        },
      },
    },
  },
})
