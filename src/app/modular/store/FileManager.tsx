import { assign, setup } from 'xstate'

export const fileManagerMachine = setup({
  types: {
    context: {} as {
      file: File | null
      error: string | null
      isValid: boolean
    },
    events: {} as { type: 'UPLOAD_FILE'; file: File } | { type: 'CLEAR_ERROR' },
  },
  guards: {
    isPdf: ({ event }) =>
      event.type === 'UPLOAD_FILE' && event.file.type.includes('pdf'),
  },
  actions: {
    setFile: assign({
      file: ({ event }) => (event.type === 'UPLOAD_FILE' ? event.file : null),
      error: null,
    }),
    setValid: assign({
      isValid: true,
      error: null,
    }),
  },
}).createMachine({
  id: 'fileManager',
  initial: 'idle',
  context: {
    file: null,
    error: null,
    isValid: false,
  },
  states: {
    idle: {
      on: {
        UPLOAD_FILE: [
          {
            target: 'ready',
            guard: 'isPdf',
            actions: ['setFile', 'setValid'],
          },
          {
            target: 'error',
            actions: [
              'setFile',
              assign({
                error: () => 'El archivo debe ser un PDF válido',
                isValid: false,
              }),
            ],
          },
        ],
      },
    },
    ready: {
      on: {
        UPLOAD_FILE: [
          {
            target: 'ready',
            guard: 'isPdf',
            actions: ['setFile', 'setValid'],
          },
          {
            target: 'error',
            actions: [
              'setFile',
              assign({
                error: () => 'El archivo debe ser un PDF válido',
                isValid: false,
              }),
            ],
          },
        ],
      },
    },
    error: {
      on: {
        UPLOAD_FILE: [
          {
            target: 'ready',
            guard: 'isPdf',
            actions: ['setFile', 'setValid'],
          },
          {
            target: 'error',
            actions: [
              'setFile',
              assign({
                error: () => 'El archivo debe ser un PDF válido',
                isValid: false,
              }),
            ],
          },
        ],
        CLEAR_ERROR: 'idle',
      },
    },
  },
})
