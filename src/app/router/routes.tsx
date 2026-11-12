import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';
import { CompleteProfilePage, ForgotPasswordPage, LoginPage } from '@/features/auth';
import { RequireProfilePending } from '../guards/RequireProfilePending';
import { RequireRole } from '../guards/RequireRole';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { NAV_ITEMS } from '@/app/config/navigation';
import { Spinner } from '@/shared/ui';
import { PagePlaceholder } from '@/shared/ui/dev/PagePlaceholder';
import { AcademicHomePage } from '../pages/AcademicHomePage';
import { ErrorPage } from '../pages/ErrorPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { NotFoundPage } from '../pages/NotFoundPage';

/** Carrega a página sob demanda (code splitting por rota). */
function lazyPage<M extends Record<string, unknown>>(load: () => Promise<M>, name: keyof M) {
  return async () => ({ Component: (await load())[name] as ComponentType });
}

const projects = () => import('@/features/projects');
const teams = () => import('@/features/teams');
const deliveries = () => import('@/features/deliveries');
const evaluations = () => import('@/features/evaluations');
const support = () => import('@/features/support');
const admin = () => import('@/features/admin');
const publicPanel = () => import('@/features/public-panel');

/** Telas de acesso: moldura própria, sem sidebar. */
const authRoutes: RouteObject = {
  element: <AuthLayout variant="photo" />, // antes: <AuthLayout />
  children: [
    { path: '/login', element: <LoginPage /> },
    { path: '/admin/login', element: <LoginPage adminOnly /> },
    { path: '/recuperar-senha', element: <ForgotPasswordPage /> },
  ],
};

/**
 * Primeiro acesso de aluno e professor após o login Microsoft. Obrigatório e único:
 * o guard só deixa passar quem ainda não concluiu o cadastro.
 */
const profileRoutes: RouteObject = {
  element: <AuthLayout variant="photo" />,
  children: [
    {
      element: <RequireProfilePending />,
      children: [{ path: '/cadastro', element: <CompleteProfilePage /> }],
    },
  ],
};

/** Área pública: vitrine, acervo e páginas de status. */
const publicRoutes: RouteObject = {
  element: <PublicLayout />,
  children: [
    { path: '/', lazy: lazyPage(publicPanel, 'PublicHomePage') },
    { path: '/projetos', lazy: lazyPage(publicPanel, 'ProjectShowcasePage') },
    { path: '/projetos/:projectId', lazy: lazyPage(projects, 'ProjectDetailPage') },
    { path: '/acervo', lazy: lazyPage(publicPanel, 'HistoricArchivePage') },
    { path: '/termos', element: <PagePlaceholder title="Termos de uso" /> },
    { path: '/privacidade', element: <PagePlaceholder title="Política de privacidade" /> },
    { path: '/acesso-negado', element: <ForbiddenPage /> },
    { path: '*', element: <NotFoundPage /> },
  ],
};

/** Áreas autenticadas, uma por perfil. */
const roleRoutes: RouteObject[] = [
  {
    element: <RequireRole allowedRoles={['STUDENT']} />,
    children: [
      {
        element: <AppLayout area="Acadêmico" nav={NAV_ITEMS.STUDENT} />,
        children: [
          { path: '/academico', element: <AcademicHomePage /> },
          { path: '/academico/equipe/buscar', lazy: lazyPage(teams, 'FindTeamPage') },
          { path: '/academico/equipe', lazy: lazyPage(teams, 'MyTeamPage') },
          { path: '/academico/projeto/novo', lazy: lazyPage(projects, 'ProjectRegistrationPage') },
          { path: '/academico/projeto', lazy: lazyPage(projects, 'TeamProjectPage') },
          { path: '/academico/projeto/entrega', lazy: lazyPage(deliveries, 'SubmitDeliveryPage') },
          {
            path: '/academico/avaliacao-membro',
            lazy: lazyPage(evaluations, 'MemberEvaluationPage'),
          },
          { path: '/academico/duvidas', lazy: lazyPage(support, 'HelpCenterPage') },
        ],
      },
    ],
  },
  {
    element: <RequireRole allowedRoles={['TEACHER']} />,
    children: [
      {
        element: <AppLayout area="Professor" nav={NAV_ITEMS.TEACHER} />,
        children: [
          { path: '/professor', lazy: lazyPage(deliveries, 'DeliveryTrackingPage') },
          { path: '/professor/integrantes', lazy: lazyPage(teams, 'MemberObservationsPage') },
        ],
      },
    ],
  },
  {
    element: <RequireRole allowedRoles={['EXTERNAL_EVALUATOR']} />,
    children: [
      {
        element: <AppLayout area="Avaliador externo" nav={NAV_ITEMS.EXTERNAL_EVALUATOR} />,
        children: [
          { path: '/avaliador', lazy: lazyPage(projects, 'FinalistProjectsPage') },
          {
            path: '/avaliador/projetos/:projectId',
            lazy: lazyPage(projects, 'FinalistProjectDetailPage'),
          },
          {
            path: '/avaliador/projetos/:projectId/avaliar',
            lazy: lazyPage(evaluations, 'EvaluationFormPage'),
          },
          { path: '/avaliador/avaliacoes', lazy: lazyPage(evaluations, 'MyEvaluationsPage') },
        ],
      },
    ],
  },
  {
    element: <RequireRole allowedRoles={['ADMIN']} loginPath="/admin/login" />,
    children: [
      {
        element: <AppLayout area="Administração" nav={NAV_ITEMS.ADMIN} />,
        children: [
          { path: '/admin', lazy: lazyPage(admin, 'AdminDashboardPage') },
          { path: '/admin/cursos-professores', lazy: lazyPage(admin, 'CoursesTeachersPage') },
          { path: '/admin/ods-desafios', lazy: lazyPage(admin, 'OdsChallengesPage') },
          { path: '/admin/criterios-rubricas', lazy: lazyPage(admin, 'CriteriaRubricsPage') },
        ],
      },
    ],
  },
];

export const routes: RouteObject[] = [
  {
    // Raiz sem path: concentra o tratamento de erro e o fallback do carregamento inicial.
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <Spinner label="Carregando a plataforma…" />,
    children: [authRoutes, profileRoutes, publicRoutes, ...roleRoutes],
  },
];
