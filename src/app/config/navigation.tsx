import type { ReactNode } from 'react';
import type { Role } from '@/features/auth';
import { IconArchive, IconCalendar, IconClipboard, IconHome, IconUsers } from '@/shared/ui/icons';
import {
  NavIconArchive,
  NavIconHelp,
  NavIconHome,
  NavIconLeadership,
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
  /** Outras rotas em que o item também fica ativo (ex.: telas internas da listagem). */
  activePaths?: readonly string[];
}

/**
 * Ativo em uma das rotas internas listadas em `activePaths` (ex.: detalhe do projeto dentro de
 * "Projetos finalistas"). A rota do próprio item continua a cargo do NavLink.
 */
export function isNavItemActive(item: NavItem, pathname: string) {
  return (item.activePaths ?? []).some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
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
  // Figma: "Sidebar - Professor". Projetos, detalhes e Acervo são as páginas públicas, que
  // continuam dentro do layout do professor (ver PublicLayout). Liderança e Integrantes são
  // telas separadas (Figma: "Liderança" e "Avaliar integrante"), cada uma com seu ícone.
  TEACHER: [
    { to: '/professor', label: 'Início', icon: <NavIconHome />, end: true, mobileBar: true },
    { to: '/projetos', label: 'Projetos', icon: <NavIconProjects /> },
    {
      to: '/professor/integrantes',
      label: 'Integrantes',
      icon: <NavIconObservations />,
      mobileBar: true,
    },
    {
      to: '/professor/lideranca',
      label: 'Liderança',
      icon: <NavIconLeadership />,
      mobileBar: true,
    },
    { to: '/acervo', label: 'Acervo', icon: <NavIconArchive /> },
  ],
  // Figma: 06 - Avaliador › "Navegação lateral" e "Navegação da área externa" (abas).
  // "Início" é a home pública, que continua dentro do layout do avaliador (ver PublicLayout).
  EXTERNAL_EVALUATOR: [
    { to: '/', label: 'Início', icon: <NavIconHome />, end: true },
    {
      to: '/avaliador',
      label: 'Projetos finalistas',
      icon: <NavIconProjects />,
      end: true,
      activePaths: ['/avaliador/projetos'],
    },
    { to: '/avaliador/avaliacoes', label: 'Minhas avaliações', icon: <NavIconArchive /> },
  ],
  ADMIN: [
    { to: '/admin', label: 'Início', icon: <IconHome />, end: true },
    { to: '/admin/cursos-professores', label: 'Cursos e professores', icon: <IconUsers /> },
    { to: '/admin/ods-desafios', label: 'ODS e desafios', icon: <IconArchive /> },
    { to: '/admin/etapas', label: 'Etapas', icon: <IconCalendar /> },
    { to: '/admin/criterios-rubricas', label: 'Critérios e rubricas', icon: <IconClipboard /> },
  ],
};
