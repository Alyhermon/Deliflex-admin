import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { token } = await request.json();

  const response = NextResponse.json({ ok: true });

  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
    // En produccion el backend vive en api.deliflex.app, un subdominio
    // distinto al del panel (panel.deliflex.app): sin este dominio
    // compartido, el navegador nunca manda la cookie al hacer fetch
    // directo al backend, y todo (dashboard, pedidos, etc.) da 401.
    domain: process.env.NODE_ENV === "production" ? ".deliflex.app" : undefined,
  });

  return response;
} 