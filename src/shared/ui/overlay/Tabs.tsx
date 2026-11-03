import * as RadixTabs from '@radix-ui/react-tabs';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './Tabs.module.css';

// Uso:
// <Tabs defaultValue="convidar">
//   <TabsList aria-label="Convites"><TabsTrigger value="convidar">Convidar</TabsTrigger>...</TabsList>
//   <TabsContent value="convidar">...</TabsContent>
// </Tabs>
export const Tabs = RadixTabs.Root;

export function TabsList({ className, ...rest }: ComponentPropsWithoutRef<typeof RadixTabs.List>) {
  return <RadixTabs.List className={cn(styles.list, className)} {...rest} />;
}

export function TabsTrigger({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof RadixTabs.Trigger>) {
  return <RadixTabs.Trigger className={cn(styles.trigger, className)} {...rest} />;
}

export function TabsContent({
  className,
  ...rest
}: ComponentPropsWithoutRef<typeof RadixTabs.Content>) {
  return <RadixTabs.Content className={cn(styles.content, className)} {...rest} />;
}
