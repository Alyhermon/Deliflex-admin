import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ staffId: string }> },
) {
  const { staffId } = await params;
  const token = request.cookies.get("auth_token")?.value;
  const businessId = request.nextUrl.searchParams.get("businessId");

  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (!businessId) {
    return NextResponse.json({ error: "Falta businessId" }, { status: 400 });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/staff/${staffId}?businessId=${encodeURIComponent(businessId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}
