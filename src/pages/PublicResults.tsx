import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Users, Calendar } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useAttempts } from "@/hooks/useAttempts"
import { useActiveCompetition } from "@/hooks/useCompetitions"
import { useCompetitionRegistrations } from "@/hooks/useCompetitionRegistrations"
import { useLiveCompetitionState } from "@/hooks/useLiveCompetition"
import { ProjectionView } from "@/components/ProjectionView";

const PublicResults = () => {
  const { theme, setTheme } = useTheme()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isProjectionMode, setIsProjectionMode] = useState(false)

  const { data: activeCompetition } = useActiveCompetition();
  const { data: attempts = [], isLoading } = useAttempts(activeCompetition?.id || "");
  const { data: registrations = [] } = useCompetitionRegistrations(activeCompetition?.id || "");
  const { data: liveState } = useLiveCompetitionState(activeCompetition?.id || "");
  // Categorías dinámicas según los atletas registrados
  const categoriesSet = new Set<string>();
  registrations.forEach((reg: any) => {
    if (reg.weight_categories?.name) categoriesSet.add(reg.weight_categories.name);
    else if (reg.category) categoriesSet.add(reg.category);
  });
  const categories = ["all", ...Array.from(categoriesSet)];

  // El atleta actual es el que está en liveState (si existe)
  const currentLifterId = liveState?.current_athlete_id || null;

  if (isProjectionMode) {
    // Mapea los atletas para ProjectionView
    const athleteRows = registrations.map((reg: any) => ({
      id: reg.athlete_id,
      name: reg.athletes?.name || "Sin nombre",
      category: reg.weight_categories?.name || reg.category || "-",
      club: reg.athletes?.club || "-",
      weight: typeof reg.athletes?.weight === "number" ? reg.athletes.weight : 0,
    }));
    return (
      <ProjectionView
        athletes={athleteRows}
        attempts={attempts}
        currentLifterId={currentLifterId}
      />
    );
  }
  // Mapeo de athlete_id a nombre, categoría y club
  const athleteInfoMap = Object.fromEntries(
    registrations.map((reg: any) => [
      reg.athlete_id,
      {
        name: reg.athletes?.name || "Sin nombre",
        category: reg.weight_categories?.name || reg.category || "-",
        club: reg.athletes?.club || "-"
      }
    ])
  );

  // Filtrar intentos por categoría seleccionada
  let filteredResults = (selectedCategory === "all"
    ? attempts
    : attempts.filter((a: any) => {
        const reg = registrations.find((r: any) => r.athlete_id === a.athlete_id);
        return reg && (reg.weight_categories?.name === selectedCategory);
      })
  ).filter((a: any) => a.result === 'valid' || a.result === 'invalid');

  // --- Agregar el próximo intento pendiente (en pausa) para cada atleta ---
  // Para cada atleta, busca el siguiente intento pendiente
  const nextAttempts: any[] = registrations.map((reg: any) => {
    const athleteAttempts = attempts.filter((a: any) => a.athlete_id === reg.athlete_id);
    // Encuentra el primer intento que no esté validado/inválido
    const liftTypes = ['squat', 'bench', 'deadlift'];
    for (let liftType of liftTypes) {
      for (let attemptNumber = 1; attemptNumber <= 3; attemptNumber++) {
        const found = athleteAttempts.find((a: any) => a.lift_type === liftType && a.attempt_number === attemptNumber);
        if (!found) {
          // Buscar el último intento registrado para ese liftType
          const last = athleteAttempts.filter((a: any) => a.lift_type === liftType && a.attempt_number === attemptNumber - 1)[0];
          let weight = 0;
          if (attemptNumber === 1) {
            // Es el opener
            weight = reg.athletes?.[liftType + '_opener'] ?? 0;
          } else if (last) {
            weight = last.weight;
          }
          return {
            id: reg.athlete_id + '_' + liftType + '_' + attemptNumber + '_pending',
            athlete_id: reg.athlete_id,
            lift_type: liftType,
            attempt_number: attemptNumber,
            weight,
            result: 'pending',
          };
        }
      }
    }
    return null;
  }).filter(Boolean);
  // Agregar los próximos intentos pendientes al resultado
  filteredResults = [...filteredResults, ...nextAttempts];

  // Elimina la función local ProjectionView para evitar shadowing y error de inicialización

  if (isProjectionMode) {
    // Mapea los atletas para ProjectionView
    const athleteRows = registrations.map((reg: any) => ({
      id: reg.athlete_id,
      name: reg.athletes?.name || "Sin nombre",
      category: reg.weight_categories?.name || reg.category || "-",
      club: reg.athletes?.club || "-",
      weight: typeof reg.athletes?.weight === "number" ? reg.athletes.weight : 0,
    }));
    return (
      <ProjectionView
        athletes={athleteRows}
        attempts={attempts}
        currentLifterId={currentLifterId}
      />
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resultados Públicos</h1>
          <p className="text-muted-foreground">
            Clasificaciones y resultados en tiempo real
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            Modo {theme === "dark" ? "Claro" : "Oscuro"}
          </Button>
          <Button
            onClick={() => setIsProjectionMode(true)}
            className="bg-powerlifting-red hover:bg-powerlifting-red-dark"
          >
            Modo Proyección
          </Button>
        </div>
      </div>

      {/* Información de competencia */}
      <Card className="bg-gradient-to-r from-powerlifting-red/10 to-powerlifting-gold/10 border-powerlifting-red/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {activeCompetition?.name ? activeCompetition.name : "Sin Competencia Activa"}
              </h2>
              <p className="text-muted-foreground">
                {activeCompetition?.date
                  ? `En curso: ${new Date(activeCompetition.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`
                  : "No hay eventos en curso actualmente"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{registrations.length}</div>
                <div className="text-sm text-muted-foreground">Atletas</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${liveState ? 'text-green-500' : 'text-gray-400'}`}>
                  {liveState ? 'ONLINE' : 'OFFLINE'}
                </div>
                <div className="text-sm text-muted-foreground">Estado</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.filter(cat => cat !== "all").map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Badge variant="secondary" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {filteredResults.length} competidores
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de resultados en vivo */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Cargando resultados...</div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center">
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay resultados disponibles</h3>
              <p className="text-muted-foreground mb-4">
                Los resultados aparecerán aquí cuando haya una competencia activa
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atleta</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Levantamiento</TableHead>
                  <TableHead>Peso (kg)</TableHead>
                  <TableHead>Intento</TableHead>
                  <TableHead>Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults
                  .slice() // copia para no mutar el original
                  .sort((a: any, b: any) => {
                    // Ordenar por nombre atleta
                    const nameA = (athleteInfoMap[a.athlete_id]?.name || '').toLowerCase();
                    const nameB = (athleteInfoMap[b.athlete_id]?.name || '').toLowerCase();
                    if (nameA < nameB) return -1;
                    if (nameA > nameB) return 1;
                    // Luego por tipo de levantamiento
                    const liftOrder = { squat: 1, bench: 2, deadlift: 3 };
                    const liftA = liftOrder[a.lift_type] || 99;
                    const liftB = liftOrder[b.lift_type] || 99;
                    if (liftA !== liftB) return liftA - liftB;
                    // Luego por número de intento
                    return (a.attempt_number || 0) - (b.attempt_number || 0);
                  })
                  .map((attempt: any) => (
                    <TableRow key={attempt.id}>
                      <TableCell>{athleteInfoMap[attempt.athlete_id]?.name || attempt.athlete_id}</TableCell>
                      <TableCell>{athleteInfoMap[attempt.athlete_id]?.category || '-'}</TableCell>
                      <TableCell>{athleteInfoMap[attempt.athlete_id]?.club || '-'}</TableCell>
                      <TableCell>{attempt.lift_type}</TableCell>
                      <TableCell>{attempt.weight}</TableCell>
                      <TableCell>{attempt.attempt_number}</TableCell>
                      <TableCell>
                        <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${attempt.result === 'valid' ? 'bg-green-600' : attempt.result === 'invalid' ? 'bg-red-600' : ''}`}>{attempt.result === 'valid' ? 'Válido' : attempt.result === 'invalid' ? 'Inválido' : 'Pendiente'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Panel de control para proyección */}
      <Card>
        <CardHeader>
          <CardTitle>Control de Pantalla</CardTitle>
          <CardDescription>
            Configuración para modo proyección en eventos
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button
            onClick={() => setIsProjectionMode(true)}
            className="bg-powerlifting-red hover:bg-powerlifting-red-dark"
          >
            Activar Proyección
          </Button>
          <Button variant="outline" disabled>
            Configurar Pantalla
          </Button>
          <Button variant="outline" disabled>
            Exportar Resultados
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default PublicResults
