import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import { ArrowLeft, Loader2 } from "lucide-react"

import { api } from "@/lib/api"
import type { Category, Product } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ImageUploader } from "@/components/products/ImageUploader"

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  price: "",
  cost: "",
  stock: "0",
  minStock: "0",
  categoryId: "",
  active: true,
}

export default function ProductForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories")).data,
  })

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await api.get<Product>(`/products/${id}`)).data,
    enabled: isEditing,
  })

  useEffect(() => {
    if (!product) {
      return
    }

    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description ?? "",
      price: product.price,
      cost: product.cost ?? "",
      stock: String(product.stock),
      minStock: String(product.minStock),
      categoryId: product.categoryId,
      active: product.active,
    })
  }, [product])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        sku: form.sku,
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        cost: form.cost ? Number(form.cost) : null,
        stock: Number(form.stock),
        minStock: Number(form.minStock),
        categoryId: form.categoryId,
        active: form.active,
      }

      if (isEditing) {
        return api.put(`/products/${id}`, payload)
      }

      return api.post("/products", payload)
    },

    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      })

      toast.add({
        title: isEditing ? "Producto actualizado" : "Producto creado",
      })

      if (!isEditing) {
        navigate(`/products/${res.data.id}`, {
          replace: true,
        })
      } else {
        queryClient.invalidateQueries({
          queryKey: ["product", id],
        })
      }
    },

    onError: (err: any) => {
      setError(err.response?.data?.message ?? "Ocurrió un error al guardar.")
    },
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    saveMutation.mutate()
  }

  if (isEditing && loadingProduct) {
    return <p className="text-sm text-muted-foreground">Cargando producto…</p>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Volver a productos"
          onClick={() => navigate("/products")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {isEditing ? "Editar producto" : "Nuevo producto"}
          </h1>

          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Actualiza los datos e imágenes del producto."
              : "Completa los datos del producto."}
          </p>
        </div>
      </div>

      {/* Product information */}
      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* SKU / Name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sku">SKU</Label>

                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      sku: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Nombre</Label>

                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>

              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
              />
            </div>

            {/* Price / Cost / Stock */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="price">Precio</Label>

                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      price: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cost">Costo</Label>

                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      cost: event.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="stock">Stock</Label>

                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      stock: event.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minStock">Stock mínimo</Label>

                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={form.minStock}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      minStock: event.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            {/* Category / Active */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="category">Categoría</Label>

                <Select
                  value={form.categoryId}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      categoryId: value,
                    })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>

                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <Label htmlFor="active">Producto activo</Label>

                  <p className="text-xs text-muted-foreground">
                    Visible para venta/inventario
                  </p>
                </div>

                <Switch
                  id="active"
                  checked={form.active}
                  onCheckedChange={(checked) =>
                    setForm({
                      ...form,
                      active: checked,
                    })
                  }
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/products")}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={saveMutation.isPending || !form.categoryId}
              >
                {saveMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {isEditing ? "Guardar cambios" : "Crear producto"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Images */}
      {isEditing && product && (
        <Card>
          <CardHeader>
            <CardTitle>Imágenes</CardTitle>
          </CardHeader>

          <CardContent>
            <ImageUploader productId={product.id} images={product.images} />
          </CardContent>
        </Card>
      )}

      {/* New product message */}
      {!isEditing && (
        <p className="text-center text-xs text-muted-foreground">
          Guarda el producto primero para poder subir sus imágenes.
        </p>
      )}
    </div>
  )
}
