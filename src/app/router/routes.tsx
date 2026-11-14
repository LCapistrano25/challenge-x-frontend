import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';
import { ForgotPasswordPage, LoginPage, RegisterPage } from '@/features/auth';
import { RequireRole } from '../guards/RequireRole';
import { AppLayout } from '../layouts/AppLayout';
import { PublicLayout } from '../layouts/PublicLayout';
import { NAV_ITEMS, ROLE_AREA } from '@/app/config/navigation';
import { AcademicHomePage } from '../pages/AcademicHomePage';
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

export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/', lazy: lazyPage(publicPanel, 'PublicHomePage') },
      { path: '/projetos', lazy: lazyPage(publicPanel, 'ProjectShowcasePage') },
      { path: '/projetos/:projectId', lazy: lazyPage(projects, 'ProjectDetailPage') },
      { path: '/acervo', lazy: lazyPage(publicPanel, 'HistoricArchivePage') },
      { path: '/login', element: <LoginPage /> },
      { path: '/cadastro', element: <RegisterPage /> },
      { path: '/recuperar-senha', element: <ForgotPasswordPage /> },
      { path: '/acesso-negado', element: <ForbiddenPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <RequireRole allowedRoles={['STUDENT']} />,
    children: [
      {
        element: <AppLayout area={ROLE_AREA.STUDENT} nav={NAV_ITEMS.STUDENT} />,
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
          { path: '/academico/notas', lazy: lazyPage(evaluations, 'StudentScoresPage') },
          { path: '/academico/duvidas', lazy: lazyPage(support, 'HelpCenterPage') },
        ],
      },
    ],
  },
  {
    element: <RequireRole allowedRoles={['TEACHER']} />,
    children: [
      {
        element: <AppLayout area={ROLE_AREA.TEACHER} nav={NAV_ITEMS.TEACHER} />,
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
        element: (
          <AppLayout area={ROLE_AREA.EXTERNAL_EVALUATOR} nav={NAV_ITEMS.EXTERNAL_EVALUATOR} />
        ),
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
    element: <RequireRole allowedRoles={['ADMIN']} />,
    children: [
      {
        element: <AppLayout area={ROLE_AREA.ADMIN} nav={NAV_ITEMS.ADMIN} />,
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
