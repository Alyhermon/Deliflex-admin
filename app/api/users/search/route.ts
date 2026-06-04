import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const email = request.nextUrl.searchParams.get("email");

  console.log("TOKEN:", token);      // ← ¿llega el token?
  console.log("EMAIL:", email);      // ← ¿llega el email?

  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const res = await fetch(`http://localhost:3001/users/search?email=${encodeURIComponent(email!)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("NESTJS STATUS:", res.status);  // ← ¿qué responde NestJS?

  const data = await res.json();
  console.log("NESTJS DATA:", data);           // ← ¿qué datos llegan?

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}