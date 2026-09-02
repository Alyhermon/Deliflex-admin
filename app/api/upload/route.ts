import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// La subida pasa por el servidor a proposito: la llave de servicio de Supabase
// nunca puede viajar al navegador. Va en .env.local, en la raiz del proyecto.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "Images";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const TAMANO_MAXIMO = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      {
        error:
          "Falta configurar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local",
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const carpeta = (formData.get("folder") as string) || "promociones";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No llego ningun archivo" }, { status: 400 });
  }

  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no permitido. Usa JPG, PNG, WEBP o GIF." },
      { status: 400 },
    );
  }

  if (file.size > TAMANO_MAXIMO) {
    return NextResponse.json(
      { error: "La imagen no puede pesar mas de 5 MB." },
      { status: 400 },
    );
  }

  // Nombre unico para no pisar imagenes anteriores.
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const ruta = `${carpeta}/${crypto.randomUUID()}.${extension}`;

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${ruta}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: await file.arrayBuffer(),
    },
  );

  if (!res.ok) {
    const detalle = await res.text();
    console.error("Error subiendo a Supabase Storage:", detalle);

    return NextResponse.json(
      { error: "No se pudo subir la imagen" },
      { status: 502 },
    );
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${ruta}`;

  return NextResponse.json({ url: publicUrl });
}
