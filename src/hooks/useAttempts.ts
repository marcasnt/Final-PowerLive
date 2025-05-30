import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Attempt = Tables<"attempts">;
export type AttemptInsert = TablesInsert<"attempts">;
export type AttemptUpdate = TablesUpdate<"attempts">;

export const useAttempts = (competitionId: string) => {
  return useQuery({
    queryKey: ["attempts", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attempts")
        .select("*")
        .eq("competition_id", competitionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!competitionId,
  });
};

export const useCreateAttempt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attempt: AttemptInsert) => {
      const { data, error } = await supabase
        .from("attempts")
        .insert(attempt)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attempts", variables.competition_id] });
    },
  });
};

export const useUpdateAttempt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & AttemptUpdate) => {
      const { data, error } = await supabase
        .from("attempts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attempts", variables.competition_id] });
    },
  });
};
