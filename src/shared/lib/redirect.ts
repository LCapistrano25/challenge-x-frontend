/** Navegação de página inteira (saindo da SPA). Isolada aqui para poder ser trocada nos testes. */
export function redirectTo(url: string): void {
  window.location.assign(url);
}
