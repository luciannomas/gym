import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

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
    if (data.role && role !== "superadmin") delete data.role;
    const user = await User.findByIdAndUpdate(id, data, { new: true, select: "-password" });
    if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session || role !== "superadmin") {
      return NextResponse.json({ error: "Solo el superadmin puede eliminar usuarios" }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: "Usuario eliminado" });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
