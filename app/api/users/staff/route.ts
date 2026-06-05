import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const res = await fetch("http://localhost:3001/users/staff", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}