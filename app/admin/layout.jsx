"use client";

import { AdminAuthProvider } from '../../hooks/useAdminAuth.js';
import AdminAuthGuard from '../AdminAuthGuard';

export default function AdminLayout({ children }) {
  return (
    <AdminAuthProvider>
      <AdminAuthGuard>
        {children}
      </AdminAuthGuard>
    </AdminAuthProvider>
  );
}