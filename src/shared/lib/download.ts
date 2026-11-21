import { env } from '@/shared/config/env';

/**
 * Baixa um arquivo por caminho autenticado (ex.: `/api/deliverable-items/301/file`)
 * enviando o cookie de sessão e salvando o Blob retornado.
 */
export async function downloadAuthenticatedFile(
  fileUrl: string,
  fileName?: string | null,
): Promise<void> {
  const base = env.apiUrl || window.location.origin;
  const target = new URL(fileUrl, base).toString();
  const response = await fetch(target, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Falha ao baixar arquivo (${response.status}).`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName ?? 'arquivo';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
