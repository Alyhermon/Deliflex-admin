import { redirect } from "next/navigation";

export default function Page() {
  // Entrar a Deliflex es entrar por el login, haya sesion o no.
  redirect("/core/login");
}
