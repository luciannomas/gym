import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Routine from "@/models/Routine";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;
    await connectDB();
    const data = await req.json();
    const routine = await Routine.findOneAndUpdate(
      { _id: id, userId: (session.user as any).id },
      data,
      { new: true }
    );
    if (!routine) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(routine);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { id } = await params;
    await connectDB();
    await Routine.findOneAndDelete({ _id: id, userId: (session.user as any).id });
    return NextResponse.json({ message: "Eliminado" });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
