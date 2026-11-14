export type AvatarTone = 'blue' | 'orange' | 'pink' | 'green' | 'neutral';

/** Ordem das cores do componente "User" no Figma. */
export const AVATAR_TONES: AvatarTone[] = ['blue', 'orange', 'pink', 'green'];

/** Cor pela posição na lista, como nas telas do Figma. */
export const toneAt = (index: number, offset = 0): AvatarTone =>
  AVATAR_TONES[(index + offset) % AVATAR_TONES.length] ?? 'blue';
