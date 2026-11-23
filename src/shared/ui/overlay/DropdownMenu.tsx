import * as Menu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './DropdownMenu.module.css';

export interface DropdownItem {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

export interface DropdownMenuProps {
  trigger: ReactNode; // um botão: <Button variant="secondary">Ações</Button>
  items: DropdownItem[];
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function DropdownMenu({
  trigger,
  items,
  align = 'end',
  side = 'bottom',
}: DropdownMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>{trigger}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Content align={align} side={side} sideOffset={6} className={styles.content}>
          {items.map((item) => (
            <Menu.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn(styles.item, item.tone === 'danger' && styles.danger)}
            >
              {item.icon}
              {item.label}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}
