import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/components/ui/toast"
import { ImageOff, Pencil, Plus, Search, Trash2 } from "lucide-react"

import { api, resolveImageUrl } from "@/lib/api"
import type { Category, Paginated, Product } from "@/types"
import { useAuth } from "@/context/AuthContext"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { formatCurrency } from "@/lib/format"

const ALL_CATEGORIES = "all"

export default function Products() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()

  const navigate = useNavigate()

  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState(ALL_CATEGORIES)
  const [page, setPage] = useState(1)

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories")).data,
  })

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, categoryId, page],
    queryFn: async () =>
      (
        await api.get<Paginated<Product>>("/products", {
          params: {
            search: search || undefined,
            categoryId: categoryId === ALL_CATEGORIES ? undefined : categoryId,
            page,
            pageSize: 12,
          },
        })
      ).data,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/products/${id}`)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["products"],
      })

      toast.add({ title: "Producto eliminado", type: "success" })
    },

    onError: (err: any) => {
      toast.add({
        title: err.response?.data?.message ?? "No se pudo eliminar.",
        type: "error",
      })
    },
  })

  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Productos</h1>

          <p className="text-sm text-muted-foreground">
            Gestiona el catálogo, stock e imágenes.
          </p>
        </div>

        <Button onClick={() => navigate("/products/new")}>
          <Plus />
          Nuevo producto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            placeholder="Buscar por nombre o SKU…"
            className="pl-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </div>

        <Select
          value={categoryId}
          onValueChange={(value) => {
            setCategoryId(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>Todas las categorías</SelectItem>

            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Loading */}
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Cargando…
                  </TableCell>
                </TableRow>
              )}

              {/* Products */}
              {!isLoading &&
                data?.items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary">
                          {product.images[0] ? (
                            <img
                              src={resolveImageUrl(product.images[0].url)}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageOff
                              aria-hidden="true"
                              className="h-4 w-4 text-muted-foreground"
                            />
                          )}
                        </div>

                        <Link
                          to={`/products/${product.id}`}
                          className="font-medium hover:underline"
                        >
                          {product.name}
                        </Link>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {product.sku}
                    </TableCell>

                    <TableCell>{product.category?.name ?? "—"}</TableCell>

                    <TableCell className="tabular-nums">
                      {formatCurrency(product.price)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          product.stock <= product.minStock
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {product.stock}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge variant={product.active ? "default" : "outline"}>
                        {product.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${product.name}`}
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Delete */}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Eliminar ${product.name}`}
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              const confirmed = window.confirm(
                                `¿Eliminar el producto "${product.name}"?`
                              )

                              if (confirmed) {
                                deleteMutation.mutate(product.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

              {/* Empty state */}
              {!isLoading && data?.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No se encontraron productos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {pagination.page} de {pagination.totalPages} ·{" "}
            {pagination.total} productos
          </span>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((currentPage) => currentPage - 1)}
            >
              Anterior
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
