"use client";
import { useEffect, useState } from "react";

function toYouTubeEmbed(url: string): string {
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  const shorts = url.match(/youtube\.com\/shorts\/([^?&]+)/);
  if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`;
  const watch = url.match(/[?&]v=([^&]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  return url;
}

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Play, Dumbbell, Plus } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { IExercise } from "@/types";

const CATEGORIES = ["Todos", "Pecho", "Espalda", "Piernas", "Hombros", "Brazos", "Core", "Cardio"];
const DIFFICULTY_COLORS = {
  beginner: "bg-[#0dcf0d]/10 text-[#0dcf0d] border-[#0dcf0d]/20",
  intermediate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  advanced: "bg-red-500/10 text-red-400 border-red-500/20",
};
const DIFFICULTY_LABELS = { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" };

export default function ExerciseList() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin" || (session?.user as any)?.role === "superadmin";
  const [exercises, setExercises] = useState<IExercise[]>([]);
  const [filtered, setFiltered] = useState<IExercise[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [selected, setSelected] = useState<IExercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((data) => {
        setExercises(Array.isArray(data) ? data : []);
        setFiltered(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = exercises;
    if (category !== "Todos") result = result.filter((e) => e.category === category);
    if (search) result = result.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(result);
  }, [search, category, exercises]);

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Button asChild size="sm" className="bg-[#0dcf0d] hover:bg-[#0ab80a] text-zinc-950 font-semibold rounded-xl">
          <Link href="/admin/exercises"><Plus size={14} className="mr-1" /> Nuevo ejercicio</Link>
        </Button>
      )}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              category === cat
                ? "bg-[#0dcf0d] text-zinc-950"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
          <p>No se encontraron ejercicios</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ex) => (
            <Card
              key={ex._id}
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer"
              onClick={() => setSelected(ex)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-100 truncate">{ex.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-500">{ex.category}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${DIFFICULTY_COLORS[ex.difficulty]}`}
                    >
                      {DIFFICULTY_LABELS[ex.difficulty]}
                    </Badge>
                  </div>
                </div>
                {ex.videoUrl && (
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <Play size={14} className="text-[#0dcf0d]" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        {selected && (
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-zinc-50">{selected.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">{selected.category}</Badge>
                <Badge variant="outline" className={`${DIFFICULTY_COLORS[selected.difficulty]}`}>
                  {DIFFICULTY_LABELS[selected.difficulty]}
                </Badge>
                {selected.muscleGroup?.map((m) => (
                  <Badge key={m} variant="outline" className="border-zinc-700 text-zinc-400 text-xs">{m}</Badge>
                ))}
              </div>

              {selected.gifUrl && (
                <img src={selected.gifUrl} alt={selected.name} className="w-full rounded-xl" />
              )}

              {selected.videoUrl && !selected.gifUrl && (
                <div className="aspect-video rounded-xl overflow-hidden bg-zinc-800">
                  <iframe
                    src={toYouTubeEmbed(selected.videoUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              <p className="text-sm text-zinc-400 leading-relaxed">{selected.description}</p>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
