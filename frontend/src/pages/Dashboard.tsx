import { useQuery } from "@tanstack/react-query"
import { Package, Tags, AlertTriangle, DollarSign } from "lucide-react"
import { api } from "@/lib/api"
import type { Category, Paginated, Product } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"

async function fetchDashboardData() {
  const [productsRes, categoriesRes] = await Promise.all([
    api.get<Paginated<Product>>("/products", { params: { pageSize: 100 } }),
    api.get<Category[]>("/categories"),
  ])
  return {
    products: productsRes.data.items,
    total: productsRes.data.pagination.total,
    categories: categoriesRes.data,
  }
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
  })

  const lowStock = data?.products.filter((p) => p.stock <= p.minStock) ?? []
  const inventoryValue =
    data?.products.reduce((sum, p) => sum + Number(p.price) * p.stock, 0) ?? 0

  const stats = [
    { label: "Productos", value: data?.total ?? 0, icon: Package },
    { label: "Categorías", value: data?.categories.length ?? 0, icon: Tags },
    {
      label: "Stock bajo",
      value: lowStock.length,
      icon: AlertTriangle,
      alert: lowStock.length > 0,
    },
    {
      label: "Valor de inventario",
      value: formatCurrency(inventoryValue),
      icon: DollarSign,
      isText: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-medium tracking-tight">
          Panel general
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen del estado actual de la tienda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {stat.label}
                </p>
                <p
                  className={
                    "mt-1 text-2xl font-semibold tabular-nums " +
                    (stat.alert ? "text-destructive" : "")
                  }
                >
                  {isLoading ? "…" : stat.value}
                </p>
              </div>
              <div
                className={
                  "flex h-9 w-9 items-center justify-center rounded-xl " +
                  (stat.alert
                    ? "bg-destructive/10 text-destructive"
                    : "bg-secondary text-muted-foreground")
                }
              >
                <stat.icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos con stock bajo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {lowStock.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todos los productos tienen stock suficiente.
            </p>
          )}
          {lowStock.slice(0, 8).map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  SKU: {product.sku}
                </p>
              </div>
              <Badge variant="destructive">
                {product.stock} / mín {product.minStock}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
