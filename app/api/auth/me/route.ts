import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  console.log("TOKEN EN COOKIE:", token); // ← ¿llega el token?

  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const res = await fetch("http://localhost:3001/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("NESTJS RESPONSE STATUS:", res.status); // ← ¿qué responde NestJS?

  if (!res.ok) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const user = await res.json();
  console.log("USER:", user); // ← ¿llega el usuario?
  return NextResponse.json(user);
}