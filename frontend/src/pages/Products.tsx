import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Search, Trash2, ImageOff } from "lucide-react"
import { api, resolveImageUrl } from "@/lib/api"
import type { Category, Paginated, Product } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/format"
import { toast } from "@/components/ui/toast"

const ALL_CATEGORIES = "all"

export default function Products() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState(ALL_CATEGORIES)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

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
    mutationFn: async (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast.add({ title: "Producto eliminado", type: "success" })
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      toast.add({
        title: err.response?.data?.message ?? "No se pudo eliminar.",
        type: "error",
      })
      setDeleteTarget(null)
    },
  })

  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-medium tracking-tight">
            Productos
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona el catálogo, stock e imágenes.
          </p>
        </div>
        <Button render={<Link to="/products/new" />} className="sm:self-start">
          <Plus />
          Nuevo producto
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o SKU…"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
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
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>Todas las categorías</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="hidden md:table-cell">SKU</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Categoría
                </TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden sm:table-cell">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
              {data?.items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary">
                        {product.images[0] ? (
                          <img
                            src={resolveImageUrl(product.images[0].url)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageOff className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/products/${product.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {product.name}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground md:hidden">
                          {product.sku}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {product.sku}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {product.category?.name}
                  </TableCell>
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
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={product.active ? "default" : "outline"}>
                      {product.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link to={`/products/${product.id}`} />}
                      >
                        <Pencil />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && !isLoading && (
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

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Página {pagination.page} de {pagination.totalPages} ·{" "}
            {pagination.total} productos
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar <strong>{deleteTarget?.name}</strong>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
