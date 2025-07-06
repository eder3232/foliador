'use client'

import { useActor, useMachine, useSelector } from '@xstate/react'
import { pdfFolioOrchestrator } from '../store/Orchestrator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Settings, Palette, Hash, RotateCcw } from 'lucide-react'
import { useOrchestrator } from '../context/MachineProvider'
import type { StateFrom } from 'xstate'
import { configManagerMachine } from '../store/ConfigManager'

export const ConfigurationPanel = () => {
  const actor = useOrchestrator()
  const state = useSelector(actor, (s) => s) as StateFrom<
    typeof pdfFolioOrchestrator
  >
  const send = actor.send

  // Observar el estado de la máquina configManager
  const configManagerRef = state.context.configManager
  const configState = useSelector(
    configManagerRef!,
    (snapshot) => snapshot
  ) as StateFrom<typeof configManagerMachine>
  const config = configState?.context

  const handlePositionUpdate = (updates: Partial<typeof config>) => {
    send({
      type: 'configManager.UPDATE_CONFIG',
      config: {
        position: {
          ...(updates.cornerVertical !== undefined && {
            cornerVertical: updates.cornerVertical,
          }),
          ...(updates.cornerHorizontal !== undefined && {
            cornerHorizontal: updates.cornerHorizontal,
          }),
          ...(updates.positionX !== undefined && {
            positionX: updates.positionX,
          }),
          ...(updates.positionY !== undefined && {
            positionY: updates.positionY,
          }),
          ...(updates.rotation !== undefined && { rotation: updates.rotation }),
          ...(updates.randomnessX !== undefined && {
            randomnessX: updates.randomnessX,
          }),
          ...(updates.randomnessY !== undefined && {
            randomnessY: updates.randomnessY,
          }),
          ...(updates.randomnessRotation !== undefined && {
            randomnessRotation: updates.randomnessRotation,
          }),
        },
      },
    })
  }

  const handleAppearanceUpdate = (updates: Partial<typeof config>) => {
    send({
      type: 'configManager.UPDATE_CONFIG',
      config: {
        appearance: {
          ...(updates.color !== undefined && { color: updates.color }),
          ...(updates.transparency !== undefined && {
            transparency: updates.transparency,
          }),
          ...(updates.fontSize !== undefined && { fontSize: updates.fontSize }),
        },
      },
    })
  }

  const handleNumberingUpdate = (updates: Partial<typeof config>) => {
    send({
      type: 'configManager.UPDATE_CONFIG',
      config: {
        numbering: {
          ...(updates.startNumber !== undefined && {
            startNumber: updates.startNumber,
          }),
          ...(updates.direction !== undefined && {
            direction: updates.direction,
          }),
          ...(updates.numberingType !== undefined && {
            numberingType: updates.numberingType,
          }),
          ...(updates.zeroPadding !== undefined && {
            zeroPadding: updates.zeroPadding,
          }),
        },
      },
    })
  }

  const handleReset = () => {
    send({ type: 'configManager.UPDATE_CONFIG', config: { reset: true } })
  }

  if (!config) return null

  return (
    <div className="space-y-6">
      {/* Posicionamiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Posicionamiento
          </CardTitle>
          <CardDescription>
            Configura la posición y orientación de los folios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Esquinas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Esquina Vertical</Label>
              <RadioGroup
                value={config.cornerVertical}
                onValueChange={(value) => {
                  handlePositionUpdate({
                    cornerVertical: value as 'top' | 'bottom',
                  })
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="top" id="top" />
                  <Label htmlFor="top">Arriba</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bottom" id="bottom" />
                  <Label htmlFor="bottom">Abajo</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label>Esquina Horizontal</Label>
              <RadioGroup
                value={config.cornerHorizontal}
                onValueChange={(value) =>
                  handlePositionUpdate({
                    cornerHorizontal: value as 'left' | 'right',
                  })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="left" id="left" />
                  <Label htmlFor="left">Izquierda</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="right" id="right" />
                  <Label htmlFor="right">Derecha</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <Separator />

          {/* Posición X/Y */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Posición X: {config.positionX}cm</Label>
              <Slider
                value={[config.positionX]}
                onValueChange={([value]) =>
                  handlePositionUpdate({ positionX: value })
                }
                min={-5}
                max={5}
                step={0.1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Posición Y: {config.positionY}cm</Label>
              <Slider
                value={[config.positionY]}
                onValueChange={([value]) =>
                  handlePositionUpdate({ positionY: value })
                }
                min={-5}
                max={5}
                step={0.1}
                className="mt-2"
              />
            </div>
          </div>

          {/* Rotación */}
          <div>
            <Label>Rotación: {config.rotation}°</Label>
            <Slider
              value={[config.rotation]}
              onValueChange={([value]) =>
                handlePositionUpdate({ rotation: value })
              }
              min={0}
              max={360}
              step={1}
              className="mt-2"
            />
          </div>

          <Separator />

          {/* Aleatoriedad */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Aleatoriedad</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">X: {config.randomnessX}cm</Label>
                <Slider
                  value={[config.randomnessX]}
                  onValueChange={([value]) =>
                    handlePositionUpdate({ randomnessX: value })
                  }
                  min={0}
                  max={5}
                  step={0.1}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Y: {config.randomnessY}cm</Label>
                <Slider
                  value={[config.randomnessY]}
                  onValueChange={([value]) =>
                    handlePositionUpdate({ randomnessY: value })
                  }
                  min={0}
                  max={5}
                  step={0.1}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">
                  Rot: {config.randomnessRotation}°
                </Label>
                <Slider
                  value={[config.randomnessRotation]}
                  onValueChange={([value]) =>
                    handlePositionUpdate({ randomnessRotation: value })
                  }
                  min={0}
                  max={30}
                  step={1}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Apariencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Apariencia
          </CardTitle>
          <CardDescription>
            Personaliza el color, transparencia y tamaño del texto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Color</Label>
              <Input
                type="color"
                value={config.color}
                onChange={(e) =>
                  handleAppearanceUpdate({ color: e.target.value })
                }
                className="h-10"
              />
            </div>
            <div>
              <Label>Transparencia: {config.transparency}%</Label>
              <Slider
                value={[config.transparency]}
                onValueChange={([value]) =>
                  handleAppearanceUpdate({ transparency: value })
                }
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
          <div>
            <Label>Tamaño de fuente: {config.fontSize}px</Label>
            <Slider
              value={[config.fontSize]}
              onValueChange={([value]) =>
                handleAppearanceUpdate({ fontSize: value })
              }
              min={8}
              max={24}
              step={1}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Numeración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Numeración
          </CardTitle>
          <CardDescription>
            Configura el tipo y formato de numeración
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número inicial</Label>
              <Input
                type="number"
                value={config.startNumber}
                onChange={(e) =>
                  handleNumberingUpdate({
                    startNumber: parseInt(e.target.value) || 1,
                  })
                }
                min={1}
              />
            </div>
            <div>
              <Label>Padding de ceros</Label>
              <Input
                type="number"
                value={config.zeroPadding}
                onChange={(e) =>
                  handleNumberingUpdate({
                    zeroPadding: parseInt(e.target.value) || 6,
                  })
                }
                min={1}
                max={10}
              />
            </div>
          </div>

          <div>
            <Label>Dirección</Label>
            <RadioGroup
              value={config.direction}
              onValueChange={(value) =>
                handleNumberingUpdate({ direction: value as 'first' | 'last' })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="first" id="first" />
                <Label htmlFor="first">Primera hoja</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last" id="last" />
                <Label htmlFor="last">Última hoja</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Tipo de numeración</Label>
            <RadioGroup
              value={config.numberingType}
              onValueChange={(value) =>
                handleNumberingUpdate({
                  numberingType: value as 'numbers' | 'letters' | 'mixed',
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="numbers" id="numbers" />
                <Label htmlFor="numbers">Solo números</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="letters" id="letters" />
                <Label htmlFor="letters">Solo letras</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed">Números y letras</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Botón de reset */}
      <Button variant="outline" onClick={handleReset} className="w-full">
        <RotateCcw className="h-4 w-4 mr-2" />
        Restablecer configuración
      </Button>
    </div>
  )
}
