import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDeleteAthlete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (athleteId: string) => {
      const { error } = await supabase.from("athletes").delete().eq("id", athleteId);
      if (error) throw error;
      return athleteId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athletes"] });
      queryClient.invalidateQueries({ queryKey: ["competition-registrations"] });
    },
  });
};
