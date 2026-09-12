// Formatea mientras se escribe: el usuario puede pegar/teclear todo junto,
// esto solo inserta los guiones, nunca cambia los digitos de verdad
// (lo que se guarda en el contexto siempre es la version formateada, y se
// le quitan los guiones de nuevo justo antes de mandarlo al backend).

// Telefono dominicano: 809-000-0999 (3-3-4, 10 digitos).
export function formatPhone(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 10);

  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

// Cedula: 000-0000000-0 (3-7-1, 11 digitos). El RNC (9 digitos) se queda
// con un solo guion mientras se escribe, no se le pidio un formato propio.
export function formatTaxId(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);

  if (d.length <= 3) return d;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 10)}-${d.slice(10)}`;
}

// Para mandar al backend: sin guiones, solo los digitos.
export const soloDigitos = (valor: string) => valor.replace(/\D/g, "");
