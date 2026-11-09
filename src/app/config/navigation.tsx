import type { ReactNode } from 'react';
import type { Role } from '@/features/auth';
import {
  IconArchive,
  IconCalendar,
  IconClipboard,
  IconFile,
  IconHelp,
  IconHome,
  IconUsers,
} from '@/shared/ui/icons';

export type NavigationProfile = 'publico' | Role;

export interface NavItem {
  to: string;
  label: string;
  icon?: ReactNode;
  end?: boolean; // true = só fica ativo na rota exata (use no "Início")
}

export const NAV_ITEMS: Record<NavigationProfile, NavItem[]> = {
  publico: [
    { to: '/', label: 'Início', icon: <IconHome />, end: true },
    { to: '/projetos', label: 'Projetos', icon: <IconClipboard /> },
    { to: '/acervo', label: 'Acervo', icon: <IconArchive /> },
    { to: '/login', label: 'Entrar', icon: <IconHelp /> },
  ],
  STUDENT: [
    { to: '/academico', label: 'Início', icon: <IconHome />, end: true },
    { to: '/academico/equipe', label: 'Minha equipe', icon: <IconUsers /> },
    { to: '/academico/projeto', label: 'Projeto', icon: <IconClipboard /> },
    { to: '/academico/duvidas', label: 'Dúvidas', icon: <IconFile /> },
    { to: '/projetos', label: 'Vitrine', icon: <IconArchive /> },
  ],
  TEACHER: [
    { to: '/professor', label: 'Início', icon: <IconHome />, end: true },
    { to: '/professor/integrantes', label: 'Integrantes', icon: <IconUsers /> },
  ],
  EXTERNAL_EVALUATOR: [
    { to: '/avaliador', label: 'Projetos finalistas', icon: <IconClipboard />, end: true },
    { to: '/avaliador/avaliacoes', label: 'Minhas avaliações', icon: <IconFile /> },
  ],
  ADMIN: [
    { to: '/admin', label: 'Início', icon: <IconHome />, end: true },
    { to: '/admin/cursos-professores', label: 'Cursos e professores', icon: <IconUsers /> },
    { to: '/admin/ods-desafios', label: 'ODS e desafios', icon: <IconArchive /> },
    { to: '/admin/criterios-rubricas', label: 'Critérios e rubricas', icon: <IconCalendar /> },
  ],
};
