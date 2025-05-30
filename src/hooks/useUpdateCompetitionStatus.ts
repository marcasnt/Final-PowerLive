import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Allowed status values for competitions
export type CompetitionStatus = "Próximo" | "En Progreso" | "Finalizado" | "Cancelado";

export const useUpdateCompetitionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: CompetitionStatus }) => {
      const { error } = await supabase.from("competitions").update({ status }).eq("id", id);
      if (error) throw error;
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
      queryClient.invalidateQueries({ queryKey: ["active-competition"] });
    },
  });
};
