import { cn } from '@/shared/lib/cn';
import styles from './Avatar.module.css';
import { getInitials } from './initials';
import { AVATAR_TONES, toneAt, type AvatarTone } from './tones';

export type { AvatarTone } from './tones';
export type AvatarSize = 'sm' | 'md' | 'lg';

/** Cor estável por nome: a mesma pessoa sempre recebe a mesma cor. */
function toneFor(name: string): AvatarTone {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length] ?? 'blue';
}

export interface AvatarProps {
  name: string;
  /** Texto exibido no lugar das iniciais (ex.: "+1"). */
  label?: string;
  tone?: AvatarTone;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ name, label, tone, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(styles.avatar, styles[size], styles[tone ?? toneFor(name)], className)}
      title={name}
      aria-hidden="true"
    >
      {label ?? getInitials(name)}
    </span>
  );
}

export interface AvatarGroupProps {
  names: string[];
  /** Quantos avatares mostrar antes do "+N". */
  max?: number;
  size?: AvatarSize;
}

/** Avatares sobrepostos. O nome completo da lista fica disponível para leitores de tela. */
export function AvatarGroup({ names, max = 3, size = 'sm' }: AvatarGroupProps) {
  const visible = names.slice(0, max);
  const rest = names.length - visible.length;

  return (
    <span className={styles.group} role="img" aria-label={`Integrantes: ${names.join(', ')}`}>
      {visible.map((name, index) => (
        <Avatar key={name} name={name} size={size} tone={toneAt(index)} />
      ))}
      {rest > 0 && <Avatar name={`Mais ${rest}`} label={`+${rest}`} tone="neutral" size={size} />}
    </span>
  );
}
