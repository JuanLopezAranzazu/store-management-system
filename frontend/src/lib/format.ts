export function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? Number(value) : value

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(
    new Date(value)
  )
}
