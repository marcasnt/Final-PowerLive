import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useResetCompetition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (competitionId: string) => {
      // Eliminar todos los intentos
      const { error: errorAttempts } = await supabase
        .from("attempts")
        .delete()
        .eq("competition_id", competitionId);
      if (errorAttempts) throw errorAttempts;

      // Eliminar todos los registros de competencia
      const { error: errorRegistrations } = await supabase
        .from("competition_registrations")
        .delete()
        .eq("competition_id", competitionId);
      if (errorRegistrations) throw errorRegistrations;

      // Eliminar el estado en vivo
      const { error: errorLiveState } = await supabase
        .from("live_competition_state")
        .delete()
        .eq("competition_id", competitionId);
      if (errorLiveState) throw errorLiveState;

      // Cambiar estado de la competencia a "Próximo"
      const { error: errorCompetition } = await supabase
        .from("competitions")
        .update({ status: "Próximo" })
        .eq("id", competitionId);
      if (errorCompetition) throw errorCompetition;

      return competitionId;
    },
    onSuccess: (_, competitionId) => {
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
      queryClient.invalidateQueries({ queryKey: ["attempts", competitionId] });
      queryClient.invalidateQueries({ queryKey: ["competition-registrations", competitionId] });
      queryClient.invalidateQueries({ queryKey: ["live-competition-state", competitionId] });
    },
  });
};
