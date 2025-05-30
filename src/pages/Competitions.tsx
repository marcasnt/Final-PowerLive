
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, Plus, Users, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCompetitions, useCreateCompetition, useUpdateCompetition } from "@/hooks/useCompetitions"
import { useToast } from "@/hooks/use-toast"
import { useCreateLiveCompetitionState } from "@/hooks/useLiveCompetition"
import { useResetCompetition } from "@/hooks/useResetCompetition"
import CompetitionManagement from "@/components/CompetitionManagement"

const Competitions = () => {
  const resetCompetition = useResetCompetition();
  const [confirmingResetId, setConfirmingResetId] = useState<string | null>(null);
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCompetition, setSelectedCompetition] = useState<string | null>(null)
  const [showManagement, setShowManagement] = useState(false)
  
  const { data: competitions = [], isLoading, error } = useCompetitions()
  const createCompetition = useCreateCompetition()
  const updateCompetition = useUpdateCompetition()
  const createLiveState = useCreateLiveCompetitionState()

  const [newCompetition, setNewCompetition] = useState({
    name: "",
    date: "",
    location: "",
    description: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCompetition.name || !newCompetition.date || !newCompetition.location) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      await createCompetition.mutateAsync({
        name: newCompetition.name,
        date: newCompetition.date,
        location: newCompetition.location,
        description: newCompetition.description || null,
        status: "Próximo"
      })

      toast({
        title: "Competencia creada",
        description: `${newCompetition.name} ha sido programada exitosamente.`,
      })

      setNewCompetition({
        name: "",
        date: "",
        location: "",
        description: ""
      })
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear la competencia. Intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleStartCompetition = async (competitionId: string) => {
    try {
      await updateCompetition.mutateAsync({
        id: competitionId,
        status: "En Progreso"
      })
      await createLiveState.mutateAsync({
        competition_id: competitionId,
        current_lift_type: "squat",
        current_round: 1,
        timer_seconds: 60,
        is_timer_running: false
      })
      toast({
        title: "Competencia iniciada",
        description: "La competencia ha comenzado oficialmente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al iniciar la competencia.",
        variant: "destructive",
      })
    }
  }

  const handleFinalizeCompetition = async (competitionId: string) => {
    try {
      await updateCompetition.mutateAsync({
        id: competitionId,
        status: "Finalizado"
      })
      toast({
        title: "Competencia finalizada",
        description: "La competencia ha sido finalizada.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al finalizar la competencia.",
        variant: "destructive",
      })
    }
  }

  const handleRestartCompetition = async (competitionId: string) => {
    try {
      await updateCompetition.mutateAsync({
        id: competitionId,
        status: "En Progreso"
      })
      await createLiveState.mutateAsync({
        competition_id: competitionId,
        current_lift_type: "squat",
        current_round: 1,
        timer_seconds: 60,
        is_timer_running: false
      })
      toast({
        title: "Competencia reiniciada",
        description: "La competencia ha sido reiniciada y está en progreso.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al reiniciar la competencia.",
        variant: "destructive",
      })
    }
  }

  const handleShowDetails = (competitionId: string) => {
    const competition = competitions.find(c => c.id === competitionId)
    if (competition) {
      setSelectedCompetition(competitionId)
      setShowManagement(true)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Próximo":
        return "bg-blue-500"
      case "En Progreso":
        return "bg-green-500"
      case "Finalizado":
        return "bg-gray-500"
      case "Cancelado":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (showManagement && selectedCompetition) {
    const competition = competitions.find(c => c.id === selectedCompetition)
    if (competition) {
      return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowManagement(false)}
            >
              ← Volver a Competencias
            </Button>
            <h1 className="text-2xl font-bold">Gestión de Competencia</h1>
          </div>
          <CompetitionManagement competition={competition} />
        </div>
      )
    }
  }

  if (error) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Error al cargar competencias</h3>
            <p className="text-muted-foreground">
              Error: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Diálogo de confirmación para reiniciar */}
      {confirmingResetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg space-y-4 max-w-sm w-full">
            <h2 className="text-lg font-bold">¿Reiniciar competencia?</h2>
            <p className="text-sm text-muted-foreground">Esto eliminará todos los intentos, inscripciones y estado en vivo de este evento. ¿Seguro que deseas continuar?</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setConfirmingResetId(null)}>Cancelar</Button>
              <Button 
                variant="destructive"
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={async () => {
                  try {
                    await resetCompetition.mutateAsync(confirmingResetId);
                    toast({
                      title: "Competencia reiniciada",
                      description: "Todos los datos han sido eliminados y la competencia está lista para iniciar de nuevo.",
                    });
                  } catch (error: any) {
                    toast({
                      title: "Error al reiniciar",
                      description: error.message || 'Ocurrió un error al reiniciar la competencia.',
                      variant: "destructive",
                    });
                  } finally {
                    setConfirmingResetId(null);
                  }
                }}
                disabled={resetCompetition.isPending}
              >
                {resetCompetition.isPending ? "Reiniciando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Competencias</h1>
          <p className="text-muted-foreground">
            Organización y administración de eventos de powerlifting
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-powerlifting-red hover:bg-powerlifting-red-dark">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Competencia
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Competencia</DialogTitle>
              <DialogDescription>
                Configure los detalles del evento
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Competencia *</Label>
                <Input
                  id="name"
                  value={newCompetition.name}
                  onChange={(e) => setNewCompetition({...newCompetition, name: e.target.value})}
                  placeholder="Ej: Nacional Abierto 2024"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newCompetition.date}
                  onChange={(e) => setNewCompetition({...newCompetition, date: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación *</Label>
                <Input
                  id="location"
                  value={newCompetition.location}
                  onChange={(e) => setNewCompetition({...newCompetition, location: e.target.value})}
                  placeholder="Ej: Centro Deportivo Nacional"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={newCompetition.description}
                  onChange={(e) => setNewCompetition({...newCompetition, description: e.target.value})}
                  placeholder="Descripción breve del evento"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-powerlifting-red hover:bg-powerlifting-red-dark"
                  disabled={createCompetition.isPending}
                >
                  {createCompetition.isPending ? "Creando..." : "Crear Competencia"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-powerlifting-red rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">{competitions.length}</div>
                <div className="text-sm text-muted-foreground">Total Competencias</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {competitions.filter(comp => comp.status === "En Progreso").length}
                </div>
                <div className="text-sm text-muted-foreground">En Progreso</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {competitions.filter(comp => comp.status === "Próximo").length}
                </div>
                <div className="text-sm text-muted-foreground">Próximas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de competencias */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">Cargando competencias...</div>
          </CardContent>
        </Card>
      ) : competitions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay competencias registradas</h3>
            <p className="text-muted-foreground mb-4">
              Comienza creando tu primera competencia de powerlifting
            </p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-powerlifting-red hover:bg-powerlifting-red-dark"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Competencia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {competitions.map((competition) => (
            <Card key={competition.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{competition.name}</CardTitle>
                    <CardDescription>{competition.description}</CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(competition.status)} text-white`}>
                    {competition.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(competition.date)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{competition.location}</span>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleShowDetails(competition.id)}
                  >
                    Ver Detalles
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleShowDetails(competition.id)}
                  >
                    Gestionar
                  </Button>
                  {competition.status === "Próximo" && (
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => handleStartCompetition(competition.id)}
                      disabled={updateCompetition.isPending || createLiveState.isPending}
                    >
                      {updateCompetition.isPending || createLiveState.isPending ? "Iniciando..." : "Iniciar"}
                    </Button>
                  )}
                  {competition.status === "En Progreso" && (
                    <Button
                      size="sm"
                      className="bg-gray-700 hover:bg-gray-800 text-white"
                      onClick={() => handleFinalizeCompetition(competition.id)}
                      disabled={updateCompetition.isPending}
                    >
                      {updateCompetition.isPending ? "Finalizando..." : "Finalizar"}
                    </Button>
                  )}
                  {/* Botón Reiniciar: visible si la competencia NO está en Próximo */}
                  {competition.status !== "Próximo" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={() => setConfirmingResetId(competition.id)}
                      disabled={resetCompetition.isPending}
                    >
                      {resetCompetition.isPending && confirmingResetId === competition.id ? "Reiniciando..." : "Reiniciar"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Banner de información */}
      <Card className="bg-gradient-to-r from-powerlifting-gold/10 to-powerlifting-red/10 border-powerlifting-gold/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-powerlifting-gold rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Sistema Conectado</h3>
              <p className="text-muted-foreground">
                La aplicación está conectada a Supabase y lista para gestionar competencias reales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Competitions
