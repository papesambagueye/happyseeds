'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/request'

/**
 * Upload an image from the device gallery (no URL input).
 *
 * The picked file is read as a data URL, downscaled to at most maxDim px on the
 * longest side and output as JPEG/WebP so the stored value stays reasonable,
 * then uploaded via /api/upload (staff-scoped). `value` holds the current image
 * data URL / URL; `onChange(url | null)` commits it to the parent form.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  maxDim = 1000,
  quality = 0.82,
}: {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  maxDim?: number
  quality?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez choisir une image (PNG, JPG, WebP…).')
      return
    }
    setBusy(true)
    try {
      const dataUrl = await fileToDownscaledDataUrl(file, maxDim, quality)
      const res = await apiClient.post<{ url: string }>('/api/upload', {
        dataUrl,
      })
      if (res.success && res.data?.url) {
        onChange(res.data.url)
        toast.success('Image ajoutée.')
      } else {
        toast.error(res.error || 'Échec de l’import de l’image.')
      }
    } catch {
      toast.error('Impossible de lire cette image.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {value ? (
            <Image src={value} alt={label} fill className="object-cover" unoptimized />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <ImagePlus className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {busy ? 'Import…' : 'Depuis ma galerie'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="inline-flex items-center gap-1 rounded-md border border-input px-2.5 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-muted"
              >
                <X className="h-4 w-4" /> Retirer
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Choisissez une photo dans votre galerie. Formats : PNG, JPG, WebP, GIF.
          </p>
        </div>
      </div>
    </div>
  )
}

/** Reads a File and returns a downscaled image data URL. */
function fileToDownscaledDataUrl(
  file: File,
  maxDim: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('no-context')
        ctx.drawImage(img, 0, 0, w, h)
        const out = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        const dataUrl = canvas.toDataURL(out, file.type === 'image/png' ? 1 : quality)
        resolve(dataUrl)
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('image-load-failed'))
    }
    img.src = objectUrl
  })
}
