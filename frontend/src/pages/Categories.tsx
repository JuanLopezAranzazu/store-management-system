import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import type { Category } from "@/types"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { toast } from "@/components/ui/toast"

const emptyForm = { id: "", name: "", description: "" }

export default function Categories() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories")).data,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, description: form.description || null }
      if (form.id) {
        return api.put(`/categories/${form.id}`, payload)
      }
      return api.post("/categories", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.add({
        title: form.id ? "Categoría actualizada" : "Categoría creada",
        type: "success",
      })
      setOpen(false)
      setForm(emptyForm)
    },
    onError: (err: any) =>
      setError(err.response?.data?.message ?? "Ocurrió un error."),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast.add({ title: "Categoría eliminada", type: "success" })
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

  function openCreate() {
    setForm(emptyForm)
    setError(null)
    setOpen(true)
  }

  function openEdit(category: Category) {
    setForm({
      id: category.id,
      name: category.name,
      description: category.description ?? "",
    })
    setError(null)
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    saveMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-medium tracking-tight">
            Categorías
          </h1>
          <p className="text-sm text-muted-foreground">
            Organiza tus productos por categoría.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus />
            Nueva categoría
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Descripción
                </TableHead>
                <TableHead>Productos</TableHead>
                {isAdmin && (
                  <TableHead className="text-right">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Cargando…
                  </TableCell>
                </TableRow>
              )}
              {categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    {category.name}
                    {category.description && (
                      <p className="line-clamp-1 text-xs font-normal text-muted-foreground sm:hidden">
                        {category.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {category.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {category._count?.products ?? 0}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(category)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(category)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {categories?.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No hay categorías todavía.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Editar categoría" : "Nueva categoría"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nombre</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Descripción (opcional)</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
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
