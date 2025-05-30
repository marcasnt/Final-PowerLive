
import { supabase } from "@/integrations/supabase/client"

export const calculateLotNumber = async (
  competitionId: string,
  squatOpener: number,
  benchOpener: number,
  deadliftOpener: number
): Promise<number> => {
  // Usar solo squatOpener para el cálculo del lote
  const s1 = squatOpener ?? 999;
  
  // Obtener todos los atletas ya registrados en la competencia
  const { data: existingRegistrations } = await supabase
    .from("competition_registrations")
    .select(`
      *,
      athletes (
        squat_opener
      )
    `)
    .eq("competition_id", competitionId)
    .order("lot_number", { ascending: true });

  if (!existingRegistrations || existingRegistrations.length === 0) {
    return 1; // Primer atleta
  }

  // Crear array de atletas con su squat_opener
  const athletesWithS1 = existingRegistrations
    .filter(reg => reg.athletes)
    .map(reg => ({
      lotNumber: reg.lot_number,
      squatOpener: reg.athletes!.squat_opener ?? 999
    }))
    .sort((a, b) => a.squatOpener - b.squatOpener);

  // Encontrar la posición correcta para el nuevo atleta
  let newLotNumber = 1;
  for (const athlete of athletesWithS1) {
    if (s1 <= athlete.squatOpener) {
      break;
    }
    newLotNumber++;
  }

  return newLotNumber;
}

export const recalculateLotNumbers = async (competitionId: string) => {
  // Obtener todos los atletas de la competencia con su squat_opener
  const { data: registrations } = await supabase
    .from("competition_registrations")
    .select(`
      id,
      athletes (
        squat_opener
      )
    `)
    .eq("competition_id", competitionId);

  if (!registrations || registrations.length === 0) {
    return;
  }

  // Ordenar solo por squat_opener (S1)
  const sortedAthletes = registrations
    .filter(reg => reg.athletes)
    .map(reg => ({
      id: reg.id,
      squatOpener: reg.athletes!.squat_opener ?? 999
    }))
    .sort((a, b) => a.squatOpener - b.squatOpener);

  // Actualizar los números de lote
  for (let i = 0; i < sortedAthletes.length; i++) {
    await supabase
      .from("competition_registrations")
      .update({ lot_number: i + 1 })
      .eq("id", sortedAthletes[i].id);
  }
}
