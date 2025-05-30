
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Check, X, Play, Pause, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useActiveCompetition } from "@/hooks/useCompetitions"
import { useLiveCompetitionState, useUpdateLiveCompetitionState } from "@/hooks/useLiveCompetition"
import { useCompetitionRegistrations } from "@/hooks/useCompetitionRegistrations"
import { useCreateAttempt } from "@/hooks/useAttempts"
import { useAttemptsWithNumber } from "@/hooks/useAttemptsWithNumber"

const CompetitionControl = () => {
  const [showNextAttemptModal, setShowNextAttemptModal] = useState(false);
  const [nextAttemptWeight, setNextAttemptWeight] = useState<number | null>(null);
  const [pendingAttempt, setPendingAttempt] = useState<{
    athleteId: string;
    liftType: 'squat' | 'bench' | 'deadlift';
    attemptNumber: number;
    competitionId: string;
    result: 'valid' | 'invalid';
  } | null>(null);

  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
const [rotatedRegistrations, setRotatedRegistrations] = useState<any[]>([]);
  const { toast } = useToast()
  const [timeLeft, setTimeLeft] = useState(60)
  const [isRunning, setIsRunning] = useState(false)

  const { data: activeCompetition } = useActiveCompetition()
  const { data: liveState } = useLiveCompetitionState(activeCompetition?.id || "")
  const { data: registrations = [] } = useCompetitionRegistrations(activeCompetition?.id || "")
  useEffect(() => {
    setRotatedRegistrations(registrations);
  }, [registrations]);
  const updateLiveState = useUpdateLiveCompetitionState()
  const createAttempt = useCreateAttempt()

  // Sync timer with live state
  useEffect(() => {
    if (liveState) {
      setTimeLeft(liveState.timer_seconds)
      setIsRunning(liveState.is_timer_running)
    }
  }, [liveState])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          const newTime = time - 1
          // Update database every 5 seconds or when timer stops
          if (newTime % 5 === 0 || newTime === 0) {
            if (liveState) {
              updateLiveState.mutate({
                id: liveState.id,
                timer_seconds: newTime,
                is_timer_running: newTime > 0
              })
            }
          }
          return newTime
        })
      }, 1000)
    } else if (timeLeft === 0) {
      setIsRunning(false)
      toast({
        title: "Tiempo agotado",
        description: "El tiempo para el intento ha terminado",
        variant: "destructive"
      })
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, liveState, updateLiveState, toast])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimer = (action: 'start' | 'pause' | 'reset') => {
    switch (action) {
      case 'start':
        setIsRunning(true)
        if (liveState) {
          updateLiveState.mutate({
            id: liveState.id,
            is_timer_running: true
          })
        }
        break
      case 'pause':
        setIsRunning(false)
        if (liveState) {
          updateLiveState.mutate({
            id: liveState.id,
            is_timer_running: false
          })
        }
        break
      case 'reset':
        setIsRunning(false)
        setTimeLeft(60)
        if (liveState) {
          updateLiveState.mutate({
            id: liveState.id,
            timer_seconds: 60,
            is_timer_running: false
          })
        }
        break
    }
  }

  // Custom hook to get attempts for the selected athlete and lift type
  const attemptsQuery = useAttemptsWithNumber(
    activeCompetition?.id || '',
    registrations.find(r => r.id === selectedAthleteId)?.athlete_id || '',
    liveState?.current_lift_type as 'squat' | 'bench' | 'deadlift'
  );

  // Nuevo flujo: solo abrir modal, el registro real ocurre en handleSaveNextAttemptWeight
  const recordAttempt = (result: 'valid' | 'invalid') => {
    if (!selectedAthleteId || !activeCompetition || !liveState) return;
    const registration = registrations.find(r => r.id === selectedAthleteId);
    const validLiftTypes = ['squat', 'bench', 'deadlift'] as const;
    const lift_type = validLiftTypes.includes(liveState.current_lift_type as any)
      ? (liveState.current_lift_type as 'squat' | 'bench' | 'deadlift')
      : 'squat';
    // Get previous attempts for this athlete and lift type
    const prevAttempts = attemptsQuery.data || [];
    const attempt_number = prevAttempts.length + 1;
    if (attempt_number === 1) {
      // Registrar el resultado del opener (primer intento)
      createAttempt.mutateAsync({
        athlete_id: registration.athlete_id,
        competition_id: activeCompetition.id,
        attempt_number: 1,
        lift_type,
        weight: registration?.[`${lift_type}_opener`] || 0,
        result,
      }).then(() => {
        handleTimer('reset');
        toast({
          title: result === 'valid' ? "Intento válido" : "Intento inválido",
          description: `Resultado registrado`,
          variant: result === 'valid' ? "default" : "destructive"
        });
        // Rotar atletas: el actual pasa al final
        let updated = rotatedRegistrations;
        const currentIdx = rotatedRegistrations.findIndex(r => r.id === selectedAthleteId);
        if (currentIdx !== -1) {
          updated = [...rotatedRegistrations];
          const [moved] = updated.splice(currentIdx, 1);
          updated.push(moved);
          setRotatedRegistrations(updated);
          setSelectedAthleteId(updated[0]?.id || null);
        }
        // Si todos han hecho opener, abrir modal para segundo intento del siguiente atleta
        const allDoneOpener = updated.every(reg => {
          const attempts = (attemptsQuery.data || []).filter((a: any) => a.athlete_id === reg.athlete_id && a.lift_type === lift_type);
          return attempts.length >= 1;
        });
        if (allDoneOpener) {
          setPendingAttempt({
            athleteId: updated[0]?.athlete_id,
            liftType: lift_type,
            attemptNumber: 2,
            competitionId: activeCompetition.id,
            result: 'valid', // Default, se cambia según botón
          });
          setShowNextAttemptModal(true);
        }
      }).catch((error) => {
        toast({
          title: "Error al registrar intento",
          description: (error as Error).message,
          variant: "destructive",
        });
      });
      return;
    }
    // Abrir el modal para el segundo y tercer intento
    if (attempt_number === 2 || attempt_number === 3) {
      setPendingAttempt({
        athleteId: registration.athlete_id,
        liftType: lift_type,
        attemptNumber: attempt_number,
        competitionId: activeCompetition.id,
        result,
      });
      setShowNextAttemptModal(true);
    }
  }

  // Handler for saving the next attempt's weight
  const handleSaveNextAttemptWeight = async () => {
    if (!pendingAttempt || nextAttemptWeight == null) return;
    // Validar que el peso nuevo sea igual o mayor al anterior intento
    const prevAttempts = (attemptsQuery.data || []).filter((a: any) => a.lift_type === pendingAttempt.liftType);
    const lastWeight = prevAttempts.length > 0 ? prevAttempts[prevAttempts.length - 1].weight : 0;
    if (nextAttemptWeight < lastWeight) {
      toast({
        title: "Peso inválido",
        description: `El peso del intento debe ser igual o mayor al anterior (${lastWeight} kg).`,
        variant: "destructive"
      });
      return;
    }
    try {
      await createAttempt.mutateAsync({
        athlete_id: pendingAttempt.athleteId,
        competition_id: pendingAttempt.competitionId,
        attempt_number: pendingAttempt.attemptNumber,
        lift_type: pendingAttempt.liftType,
        weight: nextAttemptWeight,
        result: pendingAttempt.result,
      });
      setShowNextAttemptModal(false);
      setNextAttemptWeight(null);
      setPendingAttempt(null);
      handleTimer('reset');
      toast({
        title: pendingAttempt.result === 'valid' ? "Intento válido" : "Intento inválido",
        description: `Resultado registrado`,
        variant: pendingAttempt.result === 'valid' ? "default" : "destructive"
      });
      // Rotar atleta después de cada intento (segundo y tercero)
      const currentIdx = rotatedRegistrations.findIndex(r => r.athlete_id === pendingAttempt.athleteId);
      if (currentIdx !== -1) {
        const updated = [...rotatedRegistrations];
        const [moved] = updated.splice(currentIdx, 1);
        updated.push(moved);
        setRotatedRegistrations(updated);
        setSelectedAthleteId(updated[0]?.id || null);
      }
      // Si todos han hecho el intento actual, avanzar de ronda o cambiar modalidad
      const allDone = rotatedRegistrations.every(reg => {
        const attempts = (attemptsQuery.data || []).filter((a: any) => a.athlete_id === reg.athlete_id && a.lift_type === pendingAttempt.liftType);
        return attempts.length >= pendingAttempt.attemptNumber;
      });
      if (pendingAttempt.attemptNumber === 3 && allDone) {
        // Cambiar modalidad en orden: squat -> bench -> deadlift
        const liftOrder = ['squat', 'bench', 'deadlift'];
        const currentLiftIdx = liftOrder.indexOf(pendingAttempt.liftType);
        if (currentLiftIdx !== -1 && currentLiftIdx < liftOrder.length - 1) {
          const nextLift = liftOrder[currentLiftIdx + 1];
          if (liveState) {
            updateLiveState.mutate({
              id: liveState.id,
              current_lift_type: nextLift,
              current_round: 1,
              timer_seconds: 60,
              is_timer_running: false
            });
          }
          // Resetear los registros rotados y seleccionar el primer atleta para la nueva modalidad
          setRotatedRegistrations([...registrations]);
          setSelectedAthleteId(registrations[0]?.id || null);
          toast({
            title: `Cambio a modalidad: ${nextLift.toUpperCase()}`,
            description: `Inicia el primer intento (opener) de ${nextLift}`,
            variant: 'default'
          });
          return;
        }
      }
    } catch (error) {
      toast({
        title: "Error al registrar intento",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  const progressPercentage = ((60 - timeLeft) / 60) * 100

  if (!activeCompetition) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No hay competencias activas</h3>
            <p className="text-muted-foreground">
              Inicia una competencia desde la sección de gestión para usar el control en vivo.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Control de Competencia</h1>
        <p className="text-muted-foreground">
          Gestión en tiempo real de: {activeCompetition.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de control principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timer y controles */}
          <Card>
            <CardHeader>
              <CardTitle>Timer de Competencia</CardTitle>
              <CardDescription>Control de tiempo para intentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-powerlifting-red mb-4">
                  {formatTime(timeLeft)}
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-3 mb-4"
                />
                <div className="flex justify-center gap-3">
                  <Button
                    onClick={() => handleTimer('start')}
                    disabled={isRunning}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar
                  </Button>
                  <Button
                    onClick={() => handleTimer('pause')}
                    disabled={!isRunning}
                    variant="outline"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </Button>
                  <Button
                    onClick={() => handleTimer('reset')}
                    variant="outline"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reiniciar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del intento actual */}
          <Card>
            <CardHeader>
              <CardTitle>Estado Actual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
  {selectedAthleteId ? (
    <>
      <div className="text-2xl font-bold">
        {registrations.find(r => r.id === selectedAthleteId)?.athletes?.name}
      </div>
      <div className="mb-4 text-muted-foreground">
        {registrations.find(r => r.id === selectedAthleteId)?.athletes?.club}
      </div>
      {/* Peso del intento actual */}
      <div className="my-4">
        <span className="block text-lg text-muted-foreground mb-1">Peso actual de {liveState?.current_lift_type?.toUpperCase() || 'SQUAT'}</span>
        <span className="text-5xl font-extrabold text-powerlifting-gold drop-shadow">
          {(() => {
            const reg = registrations.find(r => r.id === selectedAthleteId);
            if (!reg) return '-';
            const lift = liveState?.current_lift_type || 'squat';
            // 1. Obtener intentos previos validados de attemptsQuery
            const attempts = (attemptsQuery.data || []).filter((a: any) => a.lift_type === lift && (a.result === 'valid' || a.result === 'invalid'));
            // 2. Si no hay intentos previos, mostrar el opener
            if (attempts.length === 0) return reg.athletes?.[`${lift}_opener`] ? reg.athletes[`${lift}_opener`] + ' kg' : '-';
            // 3. Si hay intento pendiente, mostrar ese peso
            if (pendingAttempt && pendingAttempt.athleteId === reg.athlete_id && pendingAttempt.liftType === lift && nextAttemptWeight != null) {
              return nextAttemptWeight + ' kg';
            }
            // 4. Si ya hay intentos previos, mostrar el peso del último intento registrado
            return attempts[attempts.length - 1]?.weight ? attempts[attempts.length - 1].weight + ' kg' : '-';
          })()}
        </span>
      </div>
      <div className="flex gap-4 justify-center">
        <Button
          onClick={() => recordAttempt('valid')}
          className="bg-green-500 hover:bg-green-600 text-white px-8 py-3"
          size="lg"
        >
          <Check className="w-5 h-5 mr-2" />
          Válido
        </Button>
        <Button
          onClick={() => recordAttempt('invalid')}
          className="bg-red-500 hover:bg-red-600 text-white px-8 py-3"
          size="lg"
        >
          <X className="w-5 h-5 mr-2" />
          Inválido
        </Button>
      </div>
    </>
  ) : (
    <>
      <div className="text-2xl font-bold">Esperando selección de atleta</div>
      <p className="text-muted-foreground">
        Selecciona un atleta de la lista para comenzar
      </p>
      <div className="flex gap-4 justify-center">
        <Button disabled className="bg-green-500 text-white px-8 py-3" size="lg">
          <Check className="w-5 h-5 mr-2" />
          Válido
        </Button>
        <Button disabled className="bg-red-500 text-white px-8 py-3" size="lg">
          <X className="w-5 h-5 mr-2" />
          Inválido
        </Button>
      </div>
    </>
  )}
</div>
            </CardContent>
          </Card>

          {/* Lista de atletas registrados */}
          <Card>
            <CardHeader>
              <CardTitle>Atletas Registrados</CardTitle>
              <CardDescription>Competidores en esta competencia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rotatedRegistrations.map((registration, index) => (
                  <div 
                    key={registration.id}
                    onClick={() => setSelectedAthleteId(registration.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer ${selectedAthleteId === registration.id ? 'bg-accent/80 border-primary' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-muted text-muted-foreground">
                        {registration.lot_number || index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{registration.athletes?.name}
  {/* Badge de peso pendiente para el siguiente intento */}
  {pendingAttempt && pendingAttempt.athleteId === registration.athlete_id && nextAttemptWeight != null && (
    <Badge className="ml-2 bg-blue-600 text-white animate-pulse">
      Próximo: {nextAttemptWeight} kg
    </Badge>
  )}
</div>
                        <div className="text-sm text-muted-foreground">
                          {registration.athletes?.club} • {registration.weight_categories?.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Arranques: S{registration.athletes?.squat_opener && registration.athletes.squat_opener > 0 ? registration.athletes.squat_opener + "kg" : "-"} 
                      B{registration.athletes?.bench_opener && registration.athletes.bench_opener > 0 ? registration.athletes.bench_opener + "kg" : "-"} 
                      D{registration.athletes?.deadlift_opener && registration.athletes.deadlift_opener > 0 ? registration.athletes.deadlift_opener + "kg" : "-"} 
                      — Min: {(() => {
                        const vals = [registration.athletes?.squat_opener, registration.athletes?.bench_opener, registration.athletes?.deadlift_opener].filter(w => !!w && w > 0);
                        return vals.length > 0 ? Math.min(...vals) + "kg" : "-";
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Estado de la competencia */}
          <Card>
            <CardHeader>
              <CardTitle>Estado Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Disciplina:</span>
                  <Badge className="bg-powerlifting-gold text-white">
                    {liveState?.current_lift_type?.toUpperCase() || 'SQUAT'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Ronda:</span>
                  <span>{liveState?.current_round || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span>Competidores:</span>
                  <span>{registrations.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controles de disciplina */}
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Disciplina</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['squat', 'bench', 'deadlift'].map((lift) => (
                <Button
                  key={lift}
                  variant={liveState?.current_lift_type === lift ? "default" : "outline"}
                  className={`w-full ${
                    liveState?.current_lift_type === lift 
                      ? 'bg-powerlifting-red hover:bg-powerlifting-red-dark' 
                      : ''
                  }`}
                  onClick={() => {
                    if (liveState) {
                      updateLiveState.mutate({
                        id: liveState.id,
                        current_lift_type: lift
                      })
                    }
                  }}
                >
                  {lift.charAt(0).toUpperCase() + lift.slice(1)}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    {/* Modal for next attempt weight */}
    {showNextAttemptModal && pendingAttempt && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-lg border-4 border-powerlifting-gold relative">
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <Badge className="text-lg px-4 py-2 bg-powerlifting-gold text-black shadow-lg border-2 border-white uppercase tracking-widest">
          {pendingAttempt.liftType.toUpperCase()}
        </Badge>
      </div>
      <h2 className="text-2xl font-extrabold text-white mb-2 mt-4 text-center drop-shadow">Próximo intento</h2>
      <div className="text-center mb-2">
        <span className="text-lg font-semibold text-powerlifting-gold">
          {registrations.find(r => r.athlete_id === pendingAttempt.athleteId)?.athletes?.name}
        </span>
      </div>
      <div className="mb-6 text-center text-gray-300 text-sm">
        Ingresa el peso para el intento #{pendingAttempt.attemptNumber} (no incluye el opener) de {pendingAttempt.liftType === 'squat' ? 'Sentadilla' : pendingAttempt.liftType === 'bench' ? 'Banca' : 'Peso muerto'}
      </div>
      <div className="relative mb-6 flex items-center justify-center">
        <span className="absolute left-4 text-2xl text-powerlifting-gold font-bold">kg</span>
        <input
          type="number"
          className="pl-14 pr-4 py-3 rounded-lg bg-gray-900 border-2 border-powerlifting-gold text-2xl text-white font-bold w-2/3 focus:outline-none focus:ring-2 focus:ring-powerlifting-gold shadow-inner text-center transition"
          value={nextAttemptWeight ?? ''}
          onChange={e => setNextAttemptWeight(Number(e.target.value))}
          min={1}
          autoFocus
        />
      </div>
      <div className="flex gap-6 justify-center mt-2">
        <Button size="lg" onClick={() => { setShowNextAttemptModal(false); setNextAttemptWeight(null); setPendingAttempt(null); }} variant="outline" className="text-lg px-8 py-3 border-2 border-gray-400 bg-gray-800 text-gray-200 hover:bg-gray-700">Cancelar</Button>
        <Button size="lg" onClick={handleSaveNextAttemptWeight} className="text-lg px-8 py-3 bg-powerlifting-gold text-black font-bold hover:bg-yellow-400 shadow-lg">Guardar</Button>
      </div>
    </div>
  </div>
)}
  </div>
  )
}

export default CompetitionControl
