
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCreateAthlete, useWeightCategories } from "@/hooks/useAthletes"
import { useToast } from "@/hooks/use-toast"

interface AthleteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const AthleteForm = ({ open, onOpenChange }: AthleteFormProps) => {
  const { toast } = useToast()
  const createAthlete = useCreateAthlete()
  const { data: categories } = useWeightCategories()

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "" as "Masculino" | "Femenino" | "",
    weight: "",
    club: "",
    category_id: "",
    squat_opener: "",
    bench_opener: "",
    deadlift_opener: ""
  })

  const filteredCategories = categories?.filter(cat => 
    formData.gender ? cat.gender === formData.gender : true
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.age || !formData.gender || !formData.weight || !formData.club) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      await createAthlete.mutateAsync({
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        weight: parseFloat(formData.weight),
        club: formData.club,
        category_id: formData.category_id || null,
        squat_opener: formData.squat_opener ? parseInt(formData.squat_opener) : null,
        bench_opener: formData.bench_opener ? parseInt(formData.bench_opener) : null,
        deadlift_opener: formData.deadlift_opener ? parseInt(formData.deadlift_opener) : null,
      })

      toast({
        title: "Atleta registrado",
        description: `${formData.name} ha sido registrado exitosamente.`,
      })

      setFormData({
        name: "",
        age: "",
        gender: "",
        weight: "",
        club: "",
        category_id: "",
        squat_opener: "",
        bench_opener: "",
        deadlift_opener: ""
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al registrar el atleta. Intente nuevamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Atleta</DialogTitle>
          <DialogDescription>
            Complete la información del atleta
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Edad *</Label>
              <Input
                id="age"
                type="number"
                min="10"
                max="100"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Género *</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value as "Masculino" | "Femenino", category_id: ""})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="30"
                max="200"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-asignar" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories?.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="club">Club/Equipo *</Label>
            <Input
              id="club"
              value={formData.club}
              onChange={(e) => setFormData({...formData, club: e.target.value})}
              placeholder="Ej: Powerlifting Club Nacional"
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="squat">Sentadilla (kg)</Label>
              <Input
                id="squat"
                type="number"
                min="20"
                max="500"
                value={formData.squat_opener}
                onChange={(e) => setFormData({...formData, squat_opener: e.target.value})}
                placeholder="Inicial"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bench">Press Banca (kg)</Label>
              <Input
                id="bench"
                type="number"
                min="20"
                max="350"
                value={formData.bench_opener}
                onChange={(e) => setFormData({...formData, bench_opener: e.target.value})}
                placeholder="Inicial"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deadlift">Peso Muerto (kg)</Label>
              <Input
                id="deadlift"
                type="number"
                min="30"
                max="500"
                value={formData.deadlift_opener}
                onChange={(e) => setFormData({...formData, deadlift_opener: e.target.value})}
                placeholder="Inicial"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1 bg-powerlifting-red hover:bg-powerlifting-red-dark"
              disabled={createAthlete.isPending}
            >
              {createAthlete.isPending ? "Registrando..." : "Registrar Atleta"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
