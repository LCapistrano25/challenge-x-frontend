import { toast } from 'sonner';

export const notify = {
  success: (mensagem: string) => toast.success(mensagem),
  error: (mensagem: string) => toast.error(mensagem),
  info: (mensagem: string) => toast.info(mensagem),
};
