import React from 'react';
import ArsipPublicView from '@/components/arsip/ArsipPublicView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Repositori Arsip & Dokumen Kegiatan Tahunan',
  description: 'Portal publik transparansi berkas kegiatan, tahapan dokumen perencanaan hingga pertanggungjawaban tahunan.'
};

export default function ShareArsipKegiatanPage() {
  return <ArsipPublicView isEmbedded={false} />;
}
