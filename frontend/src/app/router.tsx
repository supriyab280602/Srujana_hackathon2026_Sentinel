import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { SignupPage } from '../features/auth/SignupPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { AlertsQueuePage } from '../features/alerts/AlertsQueuePage';
import { AlertDetailsPage } from '../features/alerts/AlertDetailsPage';
import { BehavioralPage } from '../features/behavioral/BehavioralPage';
import { TransactionGraphPage } from '../features/transaction-graph/TransactionGraphPage';
import { InvestigationsPage } from '../features/investigations/InvestigationsPage';
import { MonitoringPage } from '../features/monitoring/MonitoringPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/app',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'alerts',
        element: <AlertsQueuePage />,
      },
      {
        path: 'alerts/:id',
        element: <AlertDetailsPage />,
      },
      {
        path: 'behavioral',
        element: <BehavioralPage />,
      },
      {
        path: 'network',
        element: <TransactionGraphPage />,
      },
      {
        path: 'investigations',
        element: <InvestigationsPage />,
      },
      {
        path: 'monitoring',
        element: <MonitoringPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
