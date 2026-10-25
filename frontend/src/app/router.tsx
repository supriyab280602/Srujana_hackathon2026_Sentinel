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
import { InvestigationDetailPage } from '../features/investigations/InvestigationDetailPage';
import { MonitoringPage } from '../features/monitoring/MonitoringPage';
import { AccountProfilePage } from '../features/accounts/AccountProfilePage';
import { TransactionExplorerPage } from '../features/transactions/TransactionExplorerPage';
import { SettingsPage } from '../features/settings/SettingsPage';

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
  // Primary Root Routes wrapped in AppShell
  {
    element: <AppShell />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/alerts',
        element: <AlertsQueuePage />,
      },
      {
        path: '/alerts/:id',
        element: <AlertDetailsPage />,
      },
      {
        path: '/accounts/:accountId',
        element: <AccountProfilePage />,
      },
      {
        path: '/investigations',
        element: <InvestigationsPage />,
      },
      {
        path: '/investigations/:id',
        element: <InvestigationDetailPage />,
      },
      {
        path: '/transactions',
        element: <TransactionExplorerPage />,
      },
      {
        path: '/network',
        element: <TransactionGraphPage />,
      },
      {
        path: '/behavioral',
        element: <BehavioralPage />,
      },
      {
        path: '/monitoring',
        element: <MonitoringPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },
  // Legacy & Alias /app Routes wrapped in AppShell
  {
    path: '/app',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'dashboard',
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
        path: 'accounts/:accountId',
        element: <AccountProfilePage />,
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
        path: 'investigations/:id',
        element: <InvestigationDetailPage />,
      },
      {
        path: 'transactions',
        element: <TransactionExplorerPage />,
      },
      {
        path: 'monitoring',
        element: <MonitoringPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

