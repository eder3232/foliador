'use client'
import { createActorContext } from '@xstate/react'
import { ReactNode } from 'react'
import { pdfFolioOrchestrator } from '../store/Orchestrator'

// Crear el actor (instancia única)
export const OrchestratorMachineContext =
  createActorContext(pdfFolioOrchestrator)

// Crear el contexto

// Provider component
export const MachineProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Devuelve el actor y su snapshot para compatibilidad con useActor
  return (
    <OrchestratorMachineContext.Provider>
      {children}
    </OrchestratorMachineContext.Provider>
  )
}
