'use client'
import { createContext, useContext, ReactNode, useEffect } from 'react'
import { createActor, type ActorRefFrom } from 'xstate'
import { pdfFolioOrchestrator } from '../store/Orchestrator'

// Crear el actor (instancia única)
const orchestratorActor = createActor(pdfFolioOrchestrator)

// Crear el contexto
const MachineContext = createContext<ActorRefFrom<
  typeof pdfFolioOrchestrator
> | null>(null)

// Provider component
export const MachineProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    orchestratorActor.start()
    return () => {
      orchestratorActor.stop()
    }
  }, [])

  // Devuelve el actor y su snapshot para compatibilidad con useActor
  return (
    <MachineContext.Provider value={orchestratorActor}>
      {children}
    </MachineContext.Provider>
  )
}

// Hook para consumir el actor
export const useOrchestrator = (): ActorRefFrom<
  typeof pdfFolioOrchestrator
> => {
  const actor = useContext(MachineContext)
  // console.log('actor', actor?.getSnapshot().context.fileManager?.getSnapshot())
  if (!actor)
    throw new Error('useOrchestrator must be used within MachineProvider')
  return actor
}
