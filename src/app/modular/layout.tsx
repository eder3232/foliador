import { ReactNode } from 'react'
import { MachineProvider } from './context/MachineProvider'

export default function ModularLayout({ children }: { children: ReactNode }) {
  return <MachineProvider>{children}</MachineProvider>
}
