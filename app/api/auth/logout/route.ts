import { NextResponse } from "next/server";

// No existia ninguna forma de cerrar sesion en el panel (ni un boton, ni
// esta ruta) - la cookie solo se borraba sola cuando vencia. La necesita
// tanto el aviso de inactividad como cualquier futuro boton de "Cerrar
// sesión".
export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    domain: process.env.NODE_ENV === "production" ? ".deliflex.app" : undefined,
  });

  return response;
}
