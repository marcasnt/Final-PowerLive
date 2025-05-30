
import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { 
  Activity, 
  Users, 
  Calendar, 
  List,
  Check,
  FileText,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const menuItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: Activity,
    description: "Vista general del sistema"
  },
  { 
    title: "Atletas", 
    url: "/athletes", 
    icon: Users,
    description: "Gestión de competidores"
  },
  { 
    title: "Competencias", 
    url: "/competitions", 
    icon: Calendar,
    description: "Organización de eventos"
  },
  { 
    title: "Control en Vivo", 
    url: "/competition-control", 
    icon: List,
    description: "Gestión de competencia"
  },
  { 
    title: "Resultados Públicos", 
    url: "/public-results", 
    icon: FileText,
    description: "Pantalla de resultados"
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path
  const isExpanded = menuItems.some((item) => isActive(item.url))

  const getNavClasses = (path: string) => 
    cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
      isActive(path) 
        ? "bg-powerlifting-red text-white shadow-md" 
        : "hover:bg-accent text-muted-foreground hover:text-foreground"
    )

  return (
    <Sidebar
      className={cn(
        "border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="offcanvas"
    >
      <SidebarContent className="bg-card">
        {/* Logo y título */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-powerlifting-red to-powerlifting-red-dark rounded-lg flex items-center justify-center">
              <ArrowUp className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-lg">PowerLifter</h2>
                <p className="text-xs text-muted-foreground">Sistema de Competencias</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {!collapsed ? "Navegación" : ""}
          </SidebarGroupLabel>

          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavClasses(item.url)}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-xs opacity-70 truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Controles del tema */}
        {!collapsed && (
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex-1"
              >
                Claro
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex-1"
              >
                Oscuro
              </Button>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
