import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import type { Role } from "@/types"

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: Role[] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
