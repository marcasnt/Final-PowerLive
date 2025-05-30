
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Tables, TablesInsert } from "@/integrations/supabase/types"

export type CompetitionRegistration = Tables<"competition_registrations"> & {
  athletes?: Tables<"athletes">
  weight_categories?: Tables<"weight_categories">
}

export type CompetitionRegistrationInsert = TablesInsert<"competition_registrations">

export const useCompetitionRegistrations = (competitionId: string) => {
  return useQuery({
    queryKey: ["competition-registrations", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_registrations")
        .select(`
          *,
          athletes (
            id,
            name,
            weight,
            gender,
            club,
            squat_opener,
            bench_opener,
            deadlift_opener
          ),
          weight_categories (
            name,
            gender
          )
        `)
        .eq("competition_id", competitionId)
        .order("lot_number", { ascending: true, nullsFirst: false })

      if (error) throw error
      return data as CompetitionRegistration[]
    },
    enabled: !!competitionId,
  })
}

export const useCreateCompetitionRegistration = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (registration: CompetitionRegistrationInsert) => {
      const { data, error } = await supabase
        .from("competition_registrations")
        .insert(registration)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["competition-registrations", variables.competition_id] 
      })
    },
  })
}
