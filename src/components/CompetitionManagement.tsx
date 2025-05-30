import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Users, Calendar, MapPin, RefreshCw, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAthletes } from "@/hooks/useAthletes"
import { useCompetitionRegistrations, useCreateCompetitionRegistration } from "@/hooks/useCompetitionRegistrations"
import { useWeightCategories } from "@/hooks/useAthletes"
import { Competition } from "@/hooks/useCompetitions"
import { calculateLotNumber, recalculateLotNumbers } from "@/utils/lotNumberUtils"
import { useDeleteCompetitionRegistration } from "@/hooks/useDeleteCompetitionRegistration"

interface CompetitionManagementProps {
  competition: Competition
}

const CompetitionManagement = ({ competition }: CompetitionManagementProps) => {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [weighInWeight, setWeighInWeight] = useState("")
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  const { data: athletes = [] } = useAthletes()
  const { data: categories = [] } = useWeightCategories()
  const { data: registrations = [], refetch: refetchRegistrations } = useCompetitionRegistrations(competition.id)
  const createRegistration = useCreateCompetitionRegistration()
  const deleteRegistration = useDeleteCompetitionRegistration()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const selectedAthleteData = athletes.find(a => a.id === selectedAthlete);
    const athleteCategoryId = selectedAthleteData?.category_id;

    if (!selectedAthlete || (!athleteCategoryId && !selectedCategory)) {
      toast({
        title: "Error",
        description: "Por favor selecciona un atleta y una categoría",
        variant: "destructive",
      })
      return;
    }

    try {
      // Obtener los datos del atleta seleccionado
      const selectedAthleteData = athletes.find(a => a.id === selectedAthlete)
      if (!selectedAthleteData) {
        throw new Error("Atleta no encontrado")
      }

      // Calcular el número de lote automáticamente basado en pesos de arranque
      const lotNumber = await calculateLotNumber(
        competition.id,
        selectedAthleteData.squat_opener || 0,
        selectedAthleteData.bench_opener || 0,
        selectedAthleteData.deadlift_opener || 0
      )

      await createRegistration.mutateAsync({
        competition_id: competition.id,
        athlete_id: selectedAthlete,
        category_id: selectedAthleteData.category_id || selectedCategory,
        lot_number: lotNumber,
        weigh_in_weight: selectedAthleteData.weight || (weighInWeight ? parseFloat(weighInWeight) : null),
        squat_opener: selectedAthleteData.squat_opener || null,
        bench_opener: selectedAthleteData.bench_opener || null,
        deadlift_opener: selectedAthleteData.deadlift_opener || null,
      })

      // Recalcular todos los números de lote para mantener el orden correcto
      await recalculateLotNumbers(competition.id)
      await refetchRegistrations()

      toast({
        title: "Atleta registrado",
        description: `El atleta ha sido registrado con el número de lote ${lotNumber} basado en su peso de arranque más bajo.`,
      })

      setSelectedAthlete("")
      setSelectedCategory("")
      setWeighInWeight("")
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al registrar el atleta. Intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleRecalculateLots = async () => {
    setIsRecalculating(true)
    try {
      await recalculateLotNumbers(competition.id)
      await refetchRegistrations()
      toast({
        title: "Números de lote actualizados",
        description: "Los números de lote han sido recalculados según los pesos de arranque.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al recalcular los números de lote.",
        variant: "destructive",
      })
    } finally {
      setIsRecalculating(false)
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

  const handleDeleteRegistration = async (registrationId: string, athleteName: string) => {
    try {
      await deleteRegistration.mutateAsync(registrationId)
      toast({
        title: "Atleta eliminado de la competencia",
        description: `${athleteName} ha sido eliminado correctamente de la competencia.`,
      })
      await refetchRegistrations()
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el registro del atleta en la competencia.",
        variant: "destructive",
      })
    } finally {
      setConfirmingDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header de la competencia */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{competition.name}</CardTitle>
              <CardDescription className="mt-2">
                {competition.description}
              </CardDescription>
            </div>
            <Badge className="bg-powerlifting-red text-white">
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
        </CardContent>
      </Card>

      {/* Acciones y estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">{registrations.length}</div>
                <div className="text-sm text-muted-foreground">Atletas Registrados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={handleRecalculateLots}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <RefreshCw className={`w-6 h-6 text-white ${isRecalculating ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="text-lg font-semibold">Recalcular Orden</div>
                <div className="text-sm text-muted-foreground">Actualizar números de lote</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-powerlifting-red rounded-lg flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Registrar Atleta</div>
                    <div className="text-sm text-muted-foreground">Añadir nuevo competidor</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Atleta</DialogTitle>
              <DialogDescription>
                El número de lote se asignará automáticamente según el peso de arranque más bajo del atleta
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="athlete">Atleta *</Label>
                <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un atleta" />
                  </SelectTrigger>
                  <SelectContent>
                    {athletes.map((athlete) => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        {athlete.name} - {athlete.club}
                        <div className="text-xs text-muted-foreground ml-2">
                          Arranques: S{athlete.squat_opener} B{athlete.bench_opener} D{athlete.deadlift_opener}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {(() => {
                const athlete = athletes.find(a => a.id === selectedAthlete);
                if (athlete && athlete.category_id) {
                  const cat = categories.find(c => c.id === athlete.category_id);
                  return (
                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Input value={cat ? `${cat.name} (${cat.gender})` : ""} readOnly disabled />
                    </div>
                  );
                } else {
                  return (
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría *</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name} ({category.gender})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
              })()}

              {(() => {
                const athlete = athletes.find(a => a.id === selectedAthlete);
                if (athlete && athlete.weight) {
                  return (
                    <div className="space-y-2">
                      <Label>Peso de Pesaje (kg)</Label>
                      <Input value={athlete.weight} readOnly disabled />
                    </div>
                  );
                } else {
                  return (
                    <div className="space-y-2">
                      <Label htmlFor="weight">Peso de Pesaje (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={weighInWeight}
                        onChange={(e) => setWeighInWeight(e.target.value)}
                        placeholder="Ej: 82.5"
                      />
                    </div>
                  );
                }
              })()}

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Orden automático:</strong> El número de lote se asignará automáticamente basándose en el peso de arranque más bajo del atleta para optimizar el cambio de discos.
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-powerlifting-red hover:bg-powerlifting-red-dark"
                  disabled={createRegistration.isPending}
                >
                  {createRegistration.isPending ? "Registrando..." : "Registrar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de atletas registrados */}
      <Card>
        <CardHeader>
          <CardTitle>Atletas Registrados - Orden de Competencia</CardTitle>
          <CardDescription>
            Atletas ordenados por su peso de arranque más bajo (optimizado para cambio de discos)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay atletas registrados aún.
            </div>
          ) : (
            <div className="space-y-3">
              {registrations.map((registration) => {
                const athlete = registration.athletes
                const lowestOpener = athlete ? Math.min(
                  athlete.squat_opener || 999,
                  athlete.bench_opener || 999,
                  athlete.deadlift_opener || 999
                ) : 0
                
                return (
                  <div 
                    key={registration.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-powerlifting-red rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {registration.lot_number || '?'}
                      </div>
                      <div>
                        <div className="font-medium">{registration.athletes?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {registration.athletes?.club} • {registration.weight_categories?.name}
                        </div>
                        <div className="text-xs text-blue-600">
                          Arranques: S{athlete?.squat_opener} B{athlete?.bench_opener} D{athlete?.deadlift_opener} → Min: {lowestOpener}kg
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <div className="text-sm font-medium">
                          {registration.weigh_in_weight ? `${registration.weigh_in_weight}kg` : 'Sin pesaje'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {registration.athletes?.gender}
                        </div>
                      </div>
                      {confirmingDeleteId === registration.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteRegistration(registration.id, registration.athletes?.name || "")}
                            disabled={deleteRegistration.isPending}
                          >
                            {deleteRegistration.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-1" /> : null}
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmingDeleteId(null)}
                            disabled={deleteRegistration.isPending}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmingDeleteId(registration.id)}
                          disabled={deleteRegistration.isPending}
                          title="Eliminar registro de atleta"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CompetitionManagement
