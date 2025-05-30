import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type Attempt = Tables<"attempts">;

/**
 * Custom hook to get all attempts for a given competition and athlete, optionally filtered by lift_type.
 * Returns attempts sorted by attempt_number ASC.
 */
export const useAttemptsWithNumber = (
  competitionId: string,
  athleteId: string,
  liftType?: "squat" | "bench" | "deadlift"
) => {
  return useQuery({
    queryKey: ["attempts", competitionId, athleteId, liftType],
    queryFn: async () => {
      let query = supabase
        .from("attempts")
        .select("*")
        .eq("competition_id", competitionId)
        .eq("athlete_id", athleteId);
      if (liftType) {
        query = query.eq("lift_type", liftType);
      }
      const { data, error } = await query.order("attempt_number", { ascending: true });
      if (error) throw error;
      return data as Attempt[];
    },
    enabled: !!competitionId && !!athleteId,
  });
};
