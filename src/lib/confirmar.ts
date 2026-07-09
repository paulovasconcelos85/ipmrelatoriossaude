/**
 * Confirmação em duas camadas para exclusões — evita apagar algo por acidente
 * com um único clique/confirmação.
 */
export function confirmarExclusaoDupla(mensagem: string): boolean {
  if (!confirm(mensagem)) return false;
  return confirm('Tem certeza mesmo? Essa exclusão é definitiva e não pode ser desfeita.');
}
