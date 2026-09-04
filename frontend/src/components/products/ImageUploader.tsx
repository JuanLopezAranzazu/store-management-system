import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import { ImagePlus, Loader2, X } from "lucide-react"

import { api, resolveImageUrl } from "@/lib/api"
import type { ProductImage } from "@/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const MAX_IMAGES = 5

interface ImageUploaderProps {
  productId: string
  images: ProductImage[]
}

export function ImageUploader({ productId, images }: ImageUploaderProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [dragOver, setDragOver] = useState(false)

  const remainingSlots = Math.max(0, MAX_IMAGES - images.length)

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData()

      files.forEach((file) => {
        formData.append("images", file)
      })

      return api.post(`/products/${productId}/images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["product", productId],
      })

      toast.add({ title: "Imágenes subidas", type: "success" })
    },

    onError: (err: any) => {
      toast.add({ title: "Error al subir imágenes", type: "error" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      return api.delete(`/products/${productId}/images/${imageId}`)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["product", productId],
      })

      toast.add({ title: "Imagen eliminada", type: "success" })
    },

    onError: (err: any) => {
      toast.add({ title: "Error al eliminar imagen", type: "error" })
    },
  })

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return
    }

    if (remainingSlots <= 0) {
      toast.add({
        title: "Máximo de imágenes alcanzado",
        description: `Ya alcanzaste el máximo de ${MAX_IMAGES} imágenes por producto.`,
        type: "error",
      })
      return
    }

    const filesArray = Array.from(fileList).slice(0, remainingSlots)

    if (filesArray.length === 0) return

    if (inputRef.current) {
      inputRef.current.value = ""
    }

    uploadMutation.mutate(filesArray)
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragOver(false)

    if (uploadMutation.isPending || deleteMutation.isPending) {
      return
    }

    handleFiles(event.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Imágenes del producto</p>

        <span className="text-xs text-muted-foreground">
          {images.length} / {MAX_IMAGES}
        </span>
      </div>

      {/* Images */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {images.map((image) => {
          const isDeleting =
            deleteMutation.isPending && deleteMutation.variables === image.id

          return (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-md border border-border bg-secondary"
            >
              <img
                src={resolveImageUrl(image.url)}
                alt="Imagen del producto"
                className="h-full w-full object-cover"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isDeleting}
                onClick={() => deleteMutation.mutate(image.id)}
                aria-label="Eliminar imagen"
                className="hover:text-destructive-foreground absolute top-1 right-1 h-6 w-6 rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )
        })}

        {/* Upload Area */}
        {remainingSlots > 0 && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!uploadMutation.isPending) {
                inputRef.current?.click()
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                inputRef.current?.click()
              }
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => {
              setDragOver(false)
            }}
            onDrop={handleDrop}
            className={cn(
              "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border text-muted-foreground transition-colors",
              "hover:border-primary hover:text-primary",
              "focus:border-primary focus:text-primary focus:outline-none",
              dragOver && "border-primary bg-primary/5 text-primary",
              uploadMutation.isPending && "cursor-not-allowed opacity-60"
            )}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="text-[11px]">Agregar</span>
              </>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(event) => {
                handleFiles(event.target.files)
              }}
              disabled={uploadMutation.isPending}
            />
          </div>
        )}
      </div>

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Formatos permitidos: JPG, PNG, WEBP, GIF. Máximo 5 MB por imagen y{" "}
        {MAX_IMAGES} imágenes por producto.
      </p>
    </div>
  )
}
