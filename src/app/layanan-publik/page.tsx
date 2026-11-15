import React from 'react';
import PortalLayananPublik from '@/components/PortalLayananPublik';

export const metadata = {
  title: 'Pusat Form & Layanan Publik Mandiri | Portalkeu',
  description: 'Akses publik mandiri tanpa login untuk Form Perubahan RKAT, Revisi MAK, Revisi Terjadwal, dan Katalog IKU.'
};

export default function LayananPublikPage() {
  return <PortalLayananPublik embeddedInDashboard={false} />;
}

