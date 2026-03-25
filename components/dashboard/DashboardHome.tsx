"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Dumbbell, Plus, ChevronRight, CalendarCheck, Flame } from "lucide-react";
import Link from "next/link";
import { IRoutine } from "@/types";
import { toast } from "sonner";

function StatSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2].map((i) => (
        <div key={i} className="h-20 rounded-xl bg-zinc-900 animate-pulse" />
      ))}
    </div>
  );
}

export default function DashboardHome() {
  const { status } = useSession();
  const [routines, setRoutines] = useState<IRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [gymCount, setGymCount] = useState(0);
  const [doneToday, setDoneToday] = useState(false);
  const [marking, setMarking] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/routines")
      .then((r) => r.json())
      .then((data) => {
        setRoutines(Array.isArray(data) ? data.slice(0, 3) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/gym-sessions")
      .then((r) => r.json())
      .then((data) => {
        setGymCount(data.count ?? 0);
        setDoneToday(data.doneToday ?? false);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchData();
  }, [status, fetchData]);

  useEffect(() => {
    const onFocus = () => { if (status === "authenticated") fetchData(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [status, fetchData]);

  const markGymDay = async () => {
    if (doneToday || marking) return;
    setMarking(true);
    try {
      const res = await fetch("/api/gym-sessions", { method: "POST" });
      if (res.ok) {
        setDoneToday(true);
        setGymCount((c) => c + 1);
        toast.success("¡Día de gym registrado! 💪");
      }
    } catch {
      toast.error("Error al registrar");
    } finally {
      setMarking(false);
    }
  };

  const plannedDays = routines.length > 0
    ? Math.max(...routines.map((r) => r.days.length))
    : 0;

  return (
    <div className="space-y-5">
      {/* Stats rápidas */}
      {loading ? <StatSkeleton /> : (
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0dcf0d]/10 flex items-center justify-center">
                <ClipboardList size={20} className="text-[#0dcf0d]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-50">{routines.length}</p>
                <p className="text-xs text-zinc-500">Rutinas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Dumbbell size={20} className="text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-50">
                  {routines.reduce((acc, r) => acc + r.days.length, 0)}
                </p>
                <p className="text-xs text-zinc-500">Días de entreno</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tracking días de gym */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <CalendarCheck size={20} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-50">
                Días de gym{" "}
                <span className="text-yellow-400">
                  {loading ? "..." : `${gymCount}/${plannedDays || "—"}`}
                </span>{" "}
                <span className="text-zinc-500 font-normal">esta semana</span>
              </p>
              <p className="text-xs text-zinc-500">
                {doneToday ? "✓ Gym hecho hoy" : "¿Ya entrenaste hoy?"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={markGymDay}
            disabled={doneToday || marking || loading}
            className={`rounded-xl font-semibold flex-shrink-0 ${
              doneToday
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-400 text-zinc-950"
            }`}
          >
            <Flame size={14} className="mr-1" />
            {doneToday ? "Listo" : "Marcar"}
          </Button>
        </CardContent>
      </Card>

      {/* Acceso rápido */}
      <div className="grid grid-cols-2 gap-3">
        <Button asChild className="h-14 bg-[#0dcf0d] hover:bg-[#0ab80a] text-zinc-950 font-semibold rounded-xl">
          <Link href="/dashboard/routines/new">
            <Plus size={18} className="mr-1" /> Nueva rutina
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-14 border-zinc-700 hover:bg-zinc-800 rounded-xl">
          <Link href="/dashboard/exercises">
            <Dumbbell size={18} className="mr-1" /> Ver ejercicios
          </Link>
        </Button>
      </div>

      {/* Mis rutinas recientes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-zinc-200">Mis rutinas</h2>
          <Link href="/dashboard/routines" className="text-xs text-[#0dcf0d] flex items-center gap-1">
            Ver todas <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-zinc-900 animate-pulse" />
            ))}
          </div>
        ) : routines.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-zinc-500 text-sm">Todavía no tenés rutinas creadas.</p>
              <Button asChild size="sm" className="mt-3 bg-[#0dcf0d] hover:bg-[#0ab80a] text-zinc-950">
                <Link href="/dashboard/routines/new">Crear mi primera rutina</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {routines.map((routine) => (
              <Link key={routine._id} href="/dashboard/routines" className="block">
                <div className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors rounded-2xl px-4 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-zinc-100">{routine.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{routine.days.length} días</p>
                  </div>
                  <ChevronRight size={18} className="text-zinc-600 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
