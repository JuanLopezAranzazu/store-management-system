import { NavLink, Outlet } from "react-router-dom"
import { LayoutGrid, Package, Tags, Users, LogOut, Store } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { to: "/", label: "Panel", icon: LayoutGrid, end: true },
  { to: "/products", label: "Productos", icon: Package },
  { to: "/categories", label: "Categorías", icon: Tags, adminOnly: true },
  { to: "/users", label: "Usuarios", icon: Users, adminOnly: true },
]

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

type AccountMenuProps = {
  compact?: boolean
}

function AccountMenu({ compact = false }: AccountMenuProps) {
  const { user, logout, isAdmin } = useAuth()

  return (
    <DropdownMenu>
      {compact ? (
        <DropdownMenuTrigger className="rounded-full transition-opacity hover:opacity-80">
          <Avatar>
            <AvatarFallback>{user ? initials(user.name) : "?"}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-secondary">
          <Avatar>
            <AvatarFallback>{user ? initials(user.name) : "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align={compact ? "end" : "start"} className="w-56">
        {compact && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground">
                {user?.name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
        )}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            Rol
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {user?.role}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} variant="destructive">
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppLayout() {
  const { isAdmin } = useAuth()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-card md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Store className="h-4 w-4" />
          </div>
          <span className="font-heading font-medium tracking-tight">
            Store Manager
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="border-t border-border p-3">
          <AccountMenu />
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="font-heading font-medium">Store Manager</span>
          </div>
          <AccountMenu compact />
        </header>

        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-card p-2 md:hidden">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  )
                }
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            ))}
        </nav>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
