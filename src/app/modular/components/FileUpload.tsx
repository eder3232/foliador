'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle, CheckCircle, FileText, Upload } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { OrchestratorMachineContext } from '../context/MachineProvider'

export const FileUpload = () => {
  const state = OrchestratorMachineContext.useSelector((s) => s)
  const actorRef = OrchestratorMachineContext.useActorRef()
  const send = actorRef.send

  const fileState = state.context.fileManager?.getSnapshot()
  // Dropzone config
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      send({ type: 'fileManager.UPLOAD_FILE', file })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: false,
  })

  const isReady = fileState?.matches('ready') ?? false
  const hasError = fileState?.matches('error') ?? false
  const fileName = fileState?.context.file?.name

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Cargar PDF
        </CardTitle>
        <CardDescription>
          Selecciona un archivo PDF para comenzar el proceso de foliado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de éxito */}
        {isReady && fileName && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Archivo cargado:
              <strong>{fileName}</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Estado de error */}
        {hasError && fileState?.context.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{fileState.context.error}</AlertDescription>
          </Alert>
        )}

        {/* Área de carga con Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            hasError
              ? 'border-red-300 bg-red-50'
              : isReady
              ? 'border-green-300 bg-green-50'
              : isDragActive
              ? 'border-primary bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            {isDragActive
              ? 'Suelta el archivo PDF aquí...'
              : 'Arrastra y suelta tu archivo PDF aquí, o'}
          </p>
          <Button variant="outline" size="sm" type="button" disabled={false}>
            Seleccionar archivo
          </Button>
        </div>

        {/* Información adicional */}
        <div className="text-xs text-gray-500 text-center">
          <p>Formatos soportados: PDF</p>
          <p>Tamaño máximo: 50MB</p>
        </div>
      </CardContent>
    </Card>
  )
}
