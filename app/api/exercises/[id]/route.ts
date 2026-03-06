import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Exercise from "@/models/Exercise";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session || (role !== "admin" && role !== "superadmin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    const data = await req.json();
    const exercise = await Exercise.findByIdAndUpdate(id, data, { new: true });
    if (!exercise) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(exercise);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session || (role !== "admin" && role !== "superadmin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    await Exercise.findByIdAndDelete(id);
    return NextResponse.json({ message: "Eliminado" });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
