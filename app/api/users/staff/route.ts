import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const businessId = request.nextUrl.searchParams.get("businessId");

  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!businessId) {
    return NextResponse.json({ error: "Falta businessId" }, { status: 400 });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/staff?businessId=${encodeURIComponent(businessId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}