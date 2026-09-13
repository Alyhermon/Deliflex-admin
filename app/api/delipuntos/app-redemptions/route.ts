import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Los canjes que el cliente hace el mismo desde la app (boton "Enviar canje")
// se guardan directo en Supabase (tabla points_redemptions), sin pasar por el
// backend de NestJS. Por eso esta ruta habla directo con Supabase, igual que
// /api/upload, usando la llave de servicio (nunca viaja al navegador).
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  apikey: SERVICE_KEY || "",
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

type RedemptionRow = {
  id: string;
  customer_id: string;
  product_id: string | null;
  reward_id: string | null;
  points_spent: number;
  status: string;
  redemption_code: string;
  created_at: string;
  fulfilled_at: string | null;
};

type CustomerRow = { id: string; full_name: string; phone: string | null };
type NamedRow = { id: string; name: string };

export async function GET() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { error: "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 },
    );
  }

  const resRedemptions = await fetch(
    `${SUPABASE_URL}/rest/v1/points_redemptions?select=*&order=created_at.desc`,
    { headers },
  );

  if (!resRedemptions.ok) {
    return NextResponse.json({ error: "No se pudieron cargar los canjes" }, { status: 502 });
  }

  const redemptions: RedemptionRow[] = await resRedemptions.json();

  const customerIds = [...new Set(redemptions.map((r) => r.customer_id))];
  const rewardIds = [...new Set(redemptions.map((r) => r.reward_id).filter(Boolean))];
  const productIds = [...new Set(redemptions.map((r) => r.product_id).filter(Boolean))];

  const [customersRes, rewardsRes, productsRes] = await Promise.all([
    customerIds.length
      ? fetch(
          `${SUPABASE_URL}/rest/v1/customers?id=in.(${customerIds.join(",")})&select=id,full_name,phone`,
          { headers },
        )
      : Promise.resolve(null),
    rewardIds.length
      ? fetch(
          `${SUPABASE_URL}/rest/v1/delipuntos_rewards?id=in.(${rewardIds.join(",")})&select=id,name`,
          { headers },
        )
      : Promise.resolve(null),
    productIds.length
      ? fetch(
          `${SUPABASE_URL}/rest/v1/products?id=in.(${productIds.join(",")})&select=id,name`,
          { headers },
        )
      : Promise.resolve(null),
  ]);

  const customers: CustomerRow[] = customersRes ? await customersRes.json() : [];
  const rewards: NamedRow[] = rewardsRes ? await rewardsRes.json() : [];
  const products: NamedRow[] = productsRes ? await productsRes.json() : [];

  const customerById = new Map(customers.map((c) => [c.id, c]));
  const rewardById = new Map(rewards.map((r) => [r.id, r]));
  const productById = new Map(products.map((p) => [p.id, p]));

  const resultado = redemptions.map((r) => {
    const customer = customerById.get(r.customer_id);
    const itemName = r.reward_id
      ? rewardById.get(r.reward_id)?.name
      : productById.get(r.product_id ?? "")?.name;

    return {
      id: r.id,
      customer_name: customer?.full_name ?? "Cliente",
      customer_phone: customer?.phone ?? null,
      item_name: itemName ?? "Producto eliminado",
      points_spent: r.points_spent,
      status: r.status,
      redemption_code: r.redemption_code,
      created_at: r.created_at,
      fulfilled_at: r.fulfilled_at,
    };
  });

  return NextResponse.json(resultado);
}

export async function PATCH(request: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { error: "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 },
    );
  }

  const { redemptionId, status } = await request.json();

  if (!redemptionId || !["FULFILLED", "CANCELLED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/points_redemptions?id=eq.${redemptionId}`,
    {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        status,
        fulfilled_at: status === "FULFILLED" ? new Date().toISOString() : null,
      }),
    },
  );

  if (!res.ok) {
    return NextResponse.json({ error: "No se pudo actualizar el canje" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data?.[0] ?? {});
}
