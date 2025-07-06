'use client'
import { assign, fromPromise, setup } from 'xstate'

export const previewManagerMachine = setup({
  types: {
    context: {} as {
      currentPage: number
      zoom: number
      totalPages: number
      previewData: Uint8Array | null
      file: File | null
      config: any | null
    },
    events: {} as
      | { type: 'SET_PAGE'; page: number }
      | { type: 'SET_ZOOM'; zoom: number }
      | { type: 'ZOOM_IN' }
      | { type: 'ZOOM_OUT' }
      | { type: 'FIT_TO_CONTAINER' }
      | { type: 'GENERATE_PREVIEW'; file: File; config: any },
  },
  actors: {
    generatePreview: fromPromise(
      async ({ input }: { input: { file: File; config: any } }) => {
        // Generar preview de las primeras 10 páginas
        // Usar pdf-lib para aplicar configuraciones
        return new Uint8Array(1000) // Preview data
      }
    ),
  },
  actions: {
    setPage: assign({
      currentPage: ({ event }) =>
        event.type === 'SET_PAGE' ? Math.max(1, Math.min(event.page, 10)) : 1,
    }),
    setZoom: assign({
      zoom: ({ event }) =>
        event.type === 'SET_ZOOM' ? Math.max(0.5, Math.min(event.zoom, 3)) : 1,
    }),
    zoomIn: assign({
      zoom: ({ context }) => Math.min(context.zoom * 1.2, 3),
    }),
    zoomOut: assign({
      zoom: ({ context }) => Math.max(context.zoom / 1.2, 0.5),
    }),
    fitToContainer: assign({
      zoom: 1,
    }),
    setPreviewData: assign({
      previewData: ({ event }) => {
        if ('output' in event) {
          return event.output as Uint8Array
        }
        return null
      },
    }),
    saveFileAndConfig: assign({
      file: ({ event }) =>
        event.type === 'GENERATE_PREVIEW' ? event.file : null,
      config: ({ event }) =>
        event.type === 'GENERATE_PREVIEW' ? event.config : null,
    }),
  },
}).createMachine({
  id: 'previewManager',
  initial: 'idle',
  context: {
    currentPage: 1,
    zoom: 1,
    totalPages: 0,
    previewData: null,
    file: null,
    config: null,
  },
  states: {
    idle: {
      on: {
        GENERATE_PREVIEW: {
          target: 'generating',
          actions: ['saveFileAndConfig'],
        },
      },
    },
    generating: {
      invoke: {
        src: 'generatePreview',
        input: ({ context }) => ({
          file: context.file!,
          config: context.config!,
        }),
        onDone: {
          target: 'ready',
          actions: ['setPreviewData'],
        },
      },
    },
    ready: {
      on: {
        SET_PAGE: {
          actions: ['setPage'],
        },
        SET_ZOOM: {
          actions: ['setZoom'],
        },
        ZOOM_IN: {
          actions: ['zoomIn'],
        },
        ZOOM_OUT: {
          actions: ['zoomOut'],
        },
        FIT_TO_CONTAINER: {
          actions: ['fitToContainer'],
        },
        GENERATE_PREVIEW: {
          target: 'generating',
        },
      },
    },
  },
})
