import React from 'react';
import PortalLayananPublik from '@/components/PortalLayananPublik';

export const metadata = {
  title: 'Portal Layanan Mandiri (Form Publik) | Portalkeu',
  description: 'Akses dan bagikan formulir publik mandiri tanpa login untuk unit kerja.'
};

export default function DashboardLayananPublikPage() {
  return <PortalLayananPublik embeddedInDashboard={true} />;
}

