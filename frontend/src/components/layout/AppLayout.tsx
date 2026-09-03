import { Outlet } from "react-router-dom"

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
