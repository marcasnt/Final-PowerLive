import React, { useMemo, useRef, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

/**
 * ProjectionView: Pantalla de proyección en vivo para el público y atletas.
 * Props:
 * - athletes: array de atletas registrados
 * - attempts: array de intentos
 * - currentLifterId: id del atleta levantando actualmente
 */
export const LIFT_ORDER = [
  "squat_1", "squat_2", "squat_3",
  "bench_1", "bench_2", "bench_3",
  "deadlift_1", "deadlift_2", "deadlift_3"
];

function getAttemptKey(lift_type, attempt_number) {
  return `${lift_type}_${attempt_number}`;
}

const getResultColor = (result) => {
  if (result === "valid") return "bg-green-500 text-white";
  if (result === "invalid") return "bg-red-500 text-white";
  return "bg-gray-400 text-white";
};

type AthleteRow = {
  id: string;
  name: string;
  category: string;
  club: string;
  weight: number;
};
type Attempt = {
  athlete_id: string;
  attempt_number: number;
  competition_id: string;
  created_at: string;
  id: string;
  lift_type: "squat" | "bench" | "deadlift";
  result: "valid" | "invalid" | "pending";
  timestamp: string;
  weight: number;
};

interface ProjectionViewProps {
  athletes: AthleteRow[];
  attempts: Attempt[];
  currentLifterId: string | null;
}

export const ProjectionView: React.FC<ProjectionViewProps> = ({ athletes, attempts, currentLifterId }) => {
  // Agrupa intentos por atleta y tipo
  const attemptsByAthlete = useMemo(() => {
    const map = {};
    attempts.forEach((a) => {
      const key = getAttemptKey(a.lift_type, a.attempt_number);
      if (!map[a.athlete_id]) map[a.athlete_id] = {};
      map[a.athlete_id][key] = a;
    });
    return map;
  }, [attempts]);

  // Calcula totales, puntos y posición
  const athleteRows = useMemo(() => {
    return athletes.map((athlete) => {
      const athleteAttempts = attemptsByAthlete[athlete.id] || {};
      let total = 0;
      let completed = 0;
      let puntos = 0; // Aquí puedes poner tu fórmula de puntos
      LIFT_ORDER.forEach((key) => {
        const att = athleteAttempts[key];
        if (att && att.result === "valid") {
          total += att.weight;
          completed++;
        }
      });
      // Ejemplo simple de puntos: igual al total
      puntos = total;
      return {
        ...athlete,
        attempts: athleteAttempts,
        total,
        puntos,
        completed,
      };
    }).sort((a, b) => b.puntos - a.puntos);
  }, [athletes, attemptsByAthlete]);

  // Animación de cambio de posición
  const prevOrder = useRef([]);
  useEffect(() => {
    if (prevOrder.current.length > 0) {
      athleteRows.forEach((row, idx) => {
        const prevIdx = prevOrder.current.findIndex((r) => r.id === row.id);
        if (prevIdx !== -1 && prevIdx !== idx) {
          const rowEl = document.getElementById(`athlete-row-${row.id}`);
          if (rowEl) {
            rowEl.classList.add(prevIdx > idx ? "animate-rise" : "animate-fall");
            setTimeout(() => rowEl.classList.remove("animate-rise", "animate-fall"), 1500);
          }
        }
      });
    }
    prevOrder.current = athleteRows;
  }, [athleteRows]);

  // Atleta actual
  const currentLifter = athletes.find((a) => a.id === currentLifterId);

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col gap-8">
      {/* Panel destacado */}
      {currentLifter && (
        <div className="flex flex-col items-center justify-center mb-8 p-6 bg-gray-900 rounded-lg shadow-lg">
          <h2 className="text-4xl font-bold mb-2">{currentLifter.name}</h2>
          <div className="text-2xl mb-1">{currentLifter.category} | {currentLifter.weight} kg</div>
          <div className="text-6xl font-extrabold mb-2">
            {(() => {
              // Busca el intento actual
              const att = attempts.find(a => a.athlete_id === currentLifterId && a.result === "pending");
              return att ? `${att.weight} Kg` : "";
            })()}
          </div>
          {/* Aquí puedes agregar visualización de discos y rack */}
        </div>
      )}

      {/* Tabla de posiciones */}
      <div className="overflow-x-auto">
        <Table className="min-w-full text-lg">
          <TableHeader>
            <TableRow>
              <TableHead>Atleta</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Peso</TableHead>
              <TableHead>Club</TableHead>
              <TableHead>S1</TableHead>
              <TableHead>S2</TableHead>
              <TableHead>S3</TableHead>
              <TableHead>B1</TableHead>
              <TableHead>B2</TableHead>
              <TableHead>B3</TableHead>
              <TableHead>D1</TableHead>
              <TableHead>D2</TableHead>
              <TableHead>D3</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Puntos</TableHead>
              <TableHead>Posición</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {athleteRows.map((row, idx) => (
              <TableRow
                key={row.id}
                id={`athlete-row-${row.id}`}
                className={
                  (row.id === currentLifterId ? "bg-yellow-600/30 " : "") +
                  "transition-all duration-700"
                }
              >
                <TableCell className="font-bold text-xl">{row.name}</TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.weight}</TableCell>
                <TableCell>{row.club}</TableCell>
                {LIFT_ORDER.map((key) => {
                  const att = row.attempts[key];
                  return (
                    <TableCell key={key}>
                      {att ? (
                        <Badge className={getResultColor(att.result)}>
                          {att.weight}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-700 text-white">-</Badge>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="font-bold">{row.total}</TableCell>
                <TableCell>{row.puntos}</TableCell>
                <TableCell className="font-bold text-xl">{idx + 1}º</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <style>{`
        .animate-rise {
          animation: rise 1.5s;
        }
        .animate-fall {
          animation: fall 1.5s;
        }
        @keyframes rise {
          0% { background: #22c55e77; }
          100% { background: inherit; }
        }
        @keyframes fall {
          0% { background: #ef444477; }
          100% { background: inherit; }
        }
      `}</style>
    </div>
  );
}
