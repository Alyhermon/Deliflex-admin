import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { token, maxAge } = await request.json();

  const response = NextResponse.json({ ok: true });

  // El backend manda cuanto debe durar segun si el login vino con
  // "Mantener sesion iniciada" (30 dias) o no (1 hora, el default de
  // siempre): la cookie tiene que vencer junto con el token, nunca antes
  // ni despues.
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: typeof maxAge === "number" && maxAge > 0 ? maxAge : 60 * 60,
    path: "/",
    // En produccion el backend vive en api.deliflex.app, un subdominio
    // distinto al del panel (panel.deliflex.app): sin este dominio
    // compartido, el navegador nunca manda la cookie al hacer fetch
    // directo al backend, y todo (dashboard, pedidos, etc.) da 401.
    domain: process.env.NODE_ENV === "production" ? ".deliflex.app" : undefined,
  });

  return response;
} 