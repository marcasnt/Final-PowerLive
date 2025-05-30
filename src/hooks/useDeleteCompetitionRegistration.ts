import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDeleteCompetitionRegistration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase.from("competition_registrations").delete().eq("id", registrationId);
      if (error) throw error;
      return registrationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-registrations"] });
    },
  });
};
