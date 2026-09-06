import React, { useEffect } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import ChatbotPage from './pages/ChatbotPage';
import CameraPage from './pages/CameraPage';
import PrinterPage from './pages/PrinterPage';
import GovPortalPage from './pages/GovPortalPage';
import AdminLayout from './pages/AdminLayout';
import Dashboard from './pages/Dashboard';
import SourcesAdmin from './pages/SourcesAdmin';
import DevicesAdmin from './pages/DevicesAdmin';
import SchemesAdmin from './pages/SchemesAdmin';
import ConversationsAdmin from './pages/ConversationsAdmin';
import LogsAdmin from './pages/LogsAdmin';
import { connectSocket } from './services/socketService';

const router = createHashRouter([
  { path: '/', element: <ChatbotPage /> },
  { path: '/portal', element: <GovPortalPage /> },
  { path: '/camera', element: <CameraPage /> },
  { path: '/printer', element: <PrinterPage /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'sources', element: <SourcesAdmin /> },
      { path: 'devices', element: <DevicesAdmin /> },
      { path: 'schemes', element: <SchemesAdmin /> },
      { path: 'conversations', element: <ConversationsAdmin /> },
      { path: 'logs', element: <LogsAdmin /> },
    ],
  },
]);

export default function App() {
  useEffect(() => {
    // Try to connect to backend WebSocket (gracefully fails if offline)
    connectSocket();
  }, []);

  return <RouterProvider router={router} />;
}
