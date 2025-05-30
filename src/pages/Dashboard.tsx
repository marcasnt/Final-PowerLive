
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Activity, Check } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAthletes } from "@/hooks/useAthletes"
import { useCompetitions } from "@/hooks/useCompetitions"

const Dashboard = () => {
  const navigate = useNavigate()
  const { data: athletes = [] } = useAthletes()
  const { data: competitions = [] } = useCompetitions()

  const activeCompetitions = competitions.filter(comp => comp.status === "En Progreso")
  const totalAttempts = 0 // Will be calculated from attempts table later
  const totalRecords = 0 // Will be calculated from records table later

  const stats = [
    {
      title: "Atletas Registrados",
      value: athletes.length.toString(),
      change: athletes.length === 0 ? "Ninguno registrado" : `${athletes.length} registrados`,
      icon: Users,
      color: "bg-blue-500"
    },
    {
      title: "Competencias Activas",
      value: activeCompetitions.length.toString(),
      change: activeCompetitions.length === 0 ? "Ninguna activa" : `${activeCompetitions.length} en progreso`,
      icon: Calendar,
      color: "bg-powerlifting-red"
    },
    {
      title: "Total de Intentos",
      value: totalAttempts.toString(),
      change: "Sin intentos registrados",
      icon: Activity,
      color: "bg-powerlifting-gold"
    },
    {
      title: "Records Establecidos",
      value: totalRecords.toString(),
      change: "Sin records",
      icon: Check,
      color: "bg-green-500"
    }
  ]

  const quickActions = [
    {
      title: "Nuevo Atleta",
      description: "Registrar un nuevo competidor",
      action: () => navigate("/athletes"),
      color: "bg-blue-500"
    },
    {
      title: "Nueva Competencia",
      description: "Organizar un nuevo evento",
      action: () => navigate("/competitions"),
      color: "bg-powerlifting-red"
    },
    {
      title: "Control en Vivo",
      description: "Gestionar competencia activa",
      action: () => navigate("/competition-control"),
      color: "bg-powerlifting-gold"
    },
    {
      title: "Ver Resultados",
      description: "Pantalla pública de resultados",
      action: () => navigate("/public-results"),
      color: "bg-green-500"
    }
  ]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al sistema de gestión de competencias de powerlifting
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Acceso directo a las funciones principales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickActions.map((action, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={action.action}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${action.color}`} />
                  <div>
                    <h4 className="font-medium">{action.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Ir
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Estado de la aplicación */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>
              Información sobre el estado actual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Base de Datos</h4>
                <p className="text-sm text-muted-foreground">
                  Conectado a Supabase
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Datos</h4>
                <p className="text-sm text-muted-foreground">
                  {athletes.length + competitions.length > 0 ? "Con datos" : "Sin datos"}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${athletes.length + competitions.length > 0 ? "bg-green-500" : "bg-yellow-500"}`}></div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Competencias Activas</h4>
                <p className="text-sm text-muted-foreground">
                  {activeCompetitions.length} en progreso
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${activeCompetitions.length > 0 ? "bg-green-500" : "bg-gray-500"}`}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Banner de información */}
      <Card className="bg-gradient-to-r from-powerlifting-red/10 to-powerlifting-gold/10 border-powerlifting-red/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-powerlifting-red rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Sistema PowerLifter Pro Conectado</h3>
              <p className="text-muted-foreground">
                {athletes.length === 0 && competitions.length === 0 
                  ? "Sistema conectado y listo para comenzar. Registra atletas y crea competencias." 
                  : `Sistema operativo con ${athletes.length} atletas y ${competitions.length} competencias registradas.`
                }
              </p>
            </div>
            <Button 
              className="bg-powerlifting-red hover:bg-powerlifting-red-dark"
              onClick={() => navigate(athletes.length === 0 ? "/athletes" : "/competitions")}
            >
              {athletes.length === 0 ? "Registrar Atletas" : "Ver Competencias"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
