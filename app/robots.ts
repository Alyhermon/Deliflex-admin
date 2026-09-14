import type { MetadataRoute } from "next";

// Casi toda la app vive detras de login (el proxy ya manda /dashboard,
// /stores y /users-rols a /core/login sin sesion) - lo unico que un buscador
// puede ver de verdad es la pantalla de acceso. Se permite indexar esa
// entrada y se bloquea explicitamente el resto para no gastar rastreo en
// paginas que de todas formas van a devolver el mismo login.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/core/login"],
      disallow: [
        "/api/",
        "/dashboard",
        "/stores",
        "/menu",
        "/inventory",
        "/pedidos",
        "/finanzas",
        "/users-rols",
        "/promociones",
        "/delipuntos",
        "/roadmap",
        "/soporte",
        "/configuracion",
      ],
    },
    sitemap: "https://www.deliflex.app/sitemap.xml",
  };
}
