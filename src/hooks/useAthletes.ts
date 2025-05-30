
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Tables, TablesInsert } from "@/integrations/supabase/types"

export type Athlete = Tables<"athletes"> & {
  weight_categories?: Tables<"weight_categories">
}

export type AthleteInsert = TablesInsert<"athletes">

export const useAthletes = () => {
  return useQuery({
    queryKey: ["athletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athletes")
        .select(`
          *,
          weight_categories (
            name,
            gender
          )
        `)
        .order("name")

      if (error) throw error
      return data as Athlete[]
    },
  })
}

export const useCreateAthlete = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (athlete: AthleteInsert) => {
      const { data, error } = await supabase
        .from("athletes")
        .insert(athlete)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] })
    },
  })
}

export const useWeightCategories = () => {
  return useQuery({
    queryKey: ["weight-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weight_categories")
        .select("*")
        .order("gender", { ascending: true })
        .order("max_weight", { ascending: true, nullsFirst: false })

      if (error) throw error
      return data
    },
  })
}
