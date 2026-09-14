import type { MetadataRoute } from "next";

const SITE_URL = "https://www.deliflex.app";

// La unica pagina publica real es el login (/ redirige ahi mismo): no tiene
// sentido listar rutas que estan detras de sesion, un buscador nunca va a
// poder verlas de todas formas.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/core/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
