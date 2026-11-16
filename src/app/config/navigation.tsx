import type { ReactNode } from 'react';
import type { Role } from '@/features/auth';
import {
  IconArchive,
  IconCalendar,
  IconClipboard,
  IconFile,
  IconHome,
  IconUsers,
} from '@/shared/ui/icons';
import {
  NavIconArchive,
  NavIconHelp,
  NavIconHome,
  NavIconNotes,
  NavIconObservations,
  NavIconProject,
  NavIconProjects,
  NavIconTeam,
} from './nav-icons';

export type NavigationProfile = 'publico' | Role;

export interface NavItem {
  to: string;
  label: string;
  icon?: ReactNode;
  end?: boolean; // true = só fica ativo na rota exata (use no "Início")
  /**
   * No celular, fica na barra inferior. Se algum item do perfil tiver essa marca,
   * o perfil usa a navegação híbrida: barra inferior + menu ☰ com os demais itens.
   */
  mobileBar?: boolean;
  /** Só aparece para o líder da equipe (Figma: "Sidebar - Acadêmico (Líder)"). */
  leaderOnly?: boolean;
}

/** Nome da área de cada perfil (exibido no cabeçalho e no rótulo da navegação). */
export const ROLE_AREA: Record<Role, string> = {
  STUDENT: 'Acadêmico',
  TEACHER: 'Professor',
  EXTERNAL_EVALUATOR: 'Avaliador externo',
  ADMIN: 'Administração',
};

export const NAV_ITEMS: Record<NavigationProfile, NavItem[]> = {
  publico: [
    { to: '/', label: 'Início', icon: <NavIconHome />, end: true },
    { to: '/projetos', label: 'Projetos', icon: <NavIconProjects /> },
    { to: '/acervo', label: 'Acervo', icon: <NavIconArchive /> },
  ],
  // Figma: Design System › "Sidebar - Acadêmico (Líder)" (mesma ordem e rótulos).
  // "Observações" só aparece para o líder (StudentDashboard.is_leader).
  STUDENT: [
    { to: '/academico', label: 'Início', icon: <NavIconHome />, end: true, mobileBar: true },
    { to: '/academico/equipe', label: 'Equipe', icon: <NavIconTeam />, mobileBar: true },
    { to: '/academico/projeto', label: 'Meu Projeto', icon: <NavIconProject />, mobileBar: true },
    { to: '/academico/notas', label: 'Notas', icon: <NavIconNotes />, mobileBar: true },
    {
      to: '/academico/avaliacao-membro',
      label: 'Observações',
      icon: <NavIconObservations />,
      leaderOnly: true,
    },
    { to: '/projetos', label: 'Projetos', icon: <NavIconProjects /> },
    { to: '/acervo', label: 'Acervo', icon: <NavIconArchive /> },
    { to: '/academico/duvidas', label: 'Dúvidas', icon: <NavIconHelp /> },
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
