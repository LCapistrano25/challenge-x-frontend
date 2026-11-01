import axios from 'axios';
import { env } from '@/shared/config/env';

/**
 * Único cliente HTTP da aplicação. Autenticação, tratamento de erro global e
 * interceptors ficam aqui. Defina com o back-end: cookies httpOnly (withCredentials)
 * ou token no header Authorization.
 */
export const http = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
