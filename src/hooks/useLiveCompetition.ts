
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types"

export type LiveCompetitionState = Tables<"live_competition_state">
export type LiveCompetitionStateInsert = TablesInsert<"live_competition_state">
export type LiveCompetitionStateUpdate = TablesUpdate<"live_competition_state">

export const useLiveCompetitionState = (competitionId: string) => {
  return useQuery({
    queryKey: ["live-competition-state", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_competition_state")
        .select("*")
        .eq("competition_id", competitionId)
        .single()

      if (error && error.code !== "PGRST116") throw error
      return data
    },
    enabled: !!competitionId,
  })
}

export const useCreateLiveCompetitionState = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (state: LiveCompetitionStateInsert) => {
      const { data, error } = await supabase
        .from("live_competition_state")
        .insert(state)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["live-competition-state", variables.competition_id] 
      })
    },
  })
}

export const useUpdateLiveCompetitionState = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & LiveCompetitionStateUpdate) => {
      const { data, error } = await supabase
        .from("live_competition_state")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["live-competition-state", data.competition_id] 
      })
    },
  })
}
