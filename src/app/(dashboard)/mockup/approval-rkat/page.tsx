'use client';

import React, { useState } from 'react';
import { Landmark, ShoppingBasket, Scale, Undo2 } from 'lucide-react';
import { Switch } from '@headlessui/react';

export default function ApprovalRkatMockup() {
  const [enabled1, setEnabled1] = useState(false);
  const [enabled2, setEnabled2] = useState(true);

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen font-sans">
      
      {/* 3 Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#297fb8] text-white p-5 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[100px]">
          <div className="relative z-10">
            <h3 className="text-sm font-semibold mb-1 opacity-90 uppercase tracking-wide">Pagu</h3>
            <p className="text-2xl font-bold tracking-tight">Rp. 258.712.196.894,80</p>
          </div>
          <Landmark className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 opacity-20" />
        </div>

        <div className="bg-[#297fb8] text-white p-5 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[100px]">
          <div className="relative z-10">
            <h3 className="text-sm font-semibold mb-1 opacity-90 uppercase tracking-wide">Total Pengeluaran Disetujui</h3>
            <p className="text-2xl font-bold tracking-tight">Rp. 5.441.537.453,00</p>
          </div>
          <ShoppingBasket className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 opacity-20" />
        </div>

        <div className="bg-[#297fb8] text-white p-5 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[100px]">
          <div className="relative z-10">
            <h3 className="text-sm font-semibold mb-1 opacity-90 uppercase tracking-wide">Saldo RKAT</h3>
            <p className="text-2xl font-bold tracking-tight">Rp. 253.270.659.441,80</p>
          </div>
          <Scale className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 opacity-20" />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-700">Daftar Rencana Pengeluaran</h2>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm text-left border-collapse border border-gray-200">
            <thead className="bg-[#297fb8] text-white text-center">
              <tr>
                <th className="p-3 border border-[#236a99] w-12">
                  <div className="flex flex-col items-center gap-1">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                  </div>
                </th>
                <th className="p-3 border border-[#236a99] w-12 font-medium">No.</th>
                <th className="p-3 border border-[#236a99] font-medium">COA Akun / Komponen<br/>Detai Belanja /<br/>Deskripsi</th>
                <th className="p-3 border border-[#236a99] font-medium w-28">Status<br/>Approval</th>
                <th className="p-0 border border-[#236a99] w-8"></th>
                <th className="p-3 border border-[#236a99] font-medium">Kuantitas</th>
                <th className="p-3 border border-[#236a99] font-medium">Harga<br/>Satuan</th>
                <th className="p-3 border border-[#236a99] font-medium">Jumlah<br/>Anggaran</th>
                <th className="p-3 border border-[#236a99] font-medium">Nominal SPJ</th>
                <th className="p-3 border border-[#236a99] font-medium">Belum<br/>Terealisasi</th>
                <th className="p-3 border border-[#236a99] font-medium w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 align-top">
              <tr>
                <td className="p-3 border-b border-l border-gray-200 text-center align-middle">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                </td>
                <td className="p-3 border-b border-gray-200 text-center">1</td>
                <td className="p-3 border-b border-gray-200">
                  <p className="font-semibold text-gray-800 mb-2">52805 - Pemakaian Jasa Profesional</p>
                  <p className="font-semibold text-gray-800">52805</p>
                  <p className="text-gray-600 mb-2">Pemakaian Jasa Profesional</p>
                  <p className="text-gray-500 italic pl-3 border-l-2 border-gray-300">Jasa Audit KAP -<br/>BPPTN Bh 2026</p>
                </td>
                <td className="p-3 border-b border-gray-200 text-center align-middle">
                  <span className="inline-block px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium">Disetujui</span>
                </td>
                <td className="p-0 border-b border-gray-200 h-full">
                  <div className="flex flex-col h-full min-h-[160px]">
                    <div className="flex-1 bg-[#4fb2e8] text-white flex items-center justify-center rotate-180 text-xs font-medium px-1" style={{ writingMode: 'vertical-rl' }}>
                      Usulan
                    </div>
                    <div className="flex-1 bg-green-500 text-white flex items-center justify-center rotate-180 text-xs font-medium px-1 border-t border-white" style={{ writingMode: 'vertical-rl' }}>
                      Disetujui
                    </div>
                  </div>
                </td>
                <td className="p-0 border-b border-r border-gray-200 text-center h-full" colSpan={6}>
                  <div className="flex flex-col h-full">
                    {/* Baris Usulan */}
                    <div className="flex min-h-[80px]">
                      <div className="flex-1 border-r border-gray-200 p-3 flex flex-col justify-center items-center text-[#4fb2e8] font-medium">
                        <div>1 paket <span className="text-gray-400 mx-1">×</span></div>
                        <div className="font-bold text-gray-700 mt-1">1 paket</div>
                      </div>
                      <div className="flex-1 border-r border-gray-200 p-3 flex items-center justify-center text-[#4fb2e8]">1.665.000.000</div>
                      <div className="flex-1 border-r border-gray-200 p-3 flex items-center justify-center text-[#4fb2e8]">1.665.000.000</div>
                      <div className="flex-1 border-r border-gray-200 p-3 flex items-center justify-center">1.155.981.750</div>
                      <div className="flex-1 border-r border-gray-200 p-3 flex items-center justify-center">509.018.250</div>
                      <div className="w-32 p-3 flex items-center justify-center gap-2">
                         {/* Switch and Undo Action */}
                         <Switch
                            checked={enabled1}
                            onChange={setEnabled1}
                            className={`${enabled1 ? 'bg-indigo-600' : 'bg-gray-300'}
                              relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
                          >
                            <span className="sr-only">Toggle approval</span>
                            <span
                              aria-hidden="true"
                              className={`${enabled1 ? 'translate-x-[20px]' : 'translate-x-0'}
                                pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                            />
                          </Switch>
                        <button className="bg-orange-400 hover:bg-orange-500 text-white p-1.5 rounded shadow-sm">
                          <Undo2 size={16} />
                        </button>
                      </div>
                    </div>
                    {/* Baris Disetujui */}
                    <div className="flex min-h-[80px] bg-green-50/30">
                      <div className="flex-1 border-r border-t border-gray-200 p-3 flex flex-col justify-center items-center text-green-600 font-medium">
                        <div>1 paket <span className="text-gray-400 mx-1">×</span></div>
                        <div className="font-bold text-gray-700 mt-1">1 paket</div>
                      </div>
                      <div className="flex-1 border-r border-t border-gray-200 p-3 flex items-center justify-center text-green-600">1.665.000.000</div>
                      <div className="flex-1 border-r border-t border-gray-200 p-3 flex items-center justify-center text-green-600">1.665.000.000</div>
                      <div className="flex-1 border-r border-t border-gray-200 p-3 flex items-center justify-center"></div>
                      <div className="flex-1 border-r border-t border-gray-200 p-3 flex items-center justify-center"></div>
                      <div className="w-32 p-3 border-t border-gray-200 flex items-center justify-center"></div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="p-3 border-b border-l border-gray-200 text-center align-middle">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                </td>
                <td className="p-3 border-b border-gray-200 text-center">2</td>
                <td className="p-3 border-b border-gray-200">
                  <p className="font-semibold text-gray-800 mb-2">51201 - Honorarium</p>
                  <p className="font-semibold text-gray-800">51201</p>
                  <p className="text-gray-600">Honorarium</p>
                </td>
                <td className="p-3 border-b border-gray-200 text-center align-middle">
                  <span className="inline-block px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium">Disetujui</span>
                </td>
                <td className="p-0 border-b border-gray-200 h-full">
                  <div className="flex flex-col h-full min-h-[120px]">
                    <div className="flex-1 bg-[#4fb2e8] text-white flex items-center justify-center rotate-180 text-xs font-medium px-1" style={{ writingMode: 'vertical-rl' }}>
                      Usulan
                    </div>
                    <div className="flex-1 bg-green-500 text-white flex items-center justify-center rotate-180 text-xs font-medium px-1 border-t border-white" style={{ writingMode: 'vertical-rl' }}>
                      Disetujui
                    </div>
                  </div>
                </td>
                <td className="p-0 border-b border-r border-gray-200 text-center h-full" colSpan={6}>
                  <div className="flex flex-col h-full">
                    {/* Baris Usulan */}
                    <div className="flex flex-1">
                      <div className="flex-1 border-r border-gray-200 p-3 flex flex-col justify-center items-center text-[#4fb2e8]">
                        <div>1 Orang <span className="text-gray-400 mx-1">×</span></div>
                        <div>6 Jam <span className="text-gray-400 mx-1">×</span></div>
                      </div>
                      <div className="flex-1 border-r border-gray-200 p-3 flex items-center justify-center text-[#4fb2e8]">5.000.000</div>
                      <div className="flex-1 border-r border-gray-200 p-3 flex items-center justify-center text-[#4fb2e8]">30.000.000</div>
                      <div className="flex-1 border-r border-gray-200 p-3 flex items-center justify-center">0</div>
                      <div className="flex-1 border-r border-gray-200 p-3 flex items-center justify-center">30.000.000</div>
                      <div className="w-32 p-3 flex items-center justify-center gap-2">
                        {/* Switch and Undo Action */}
                        <Switch
                            checked={enabled2}
                            onChange={setEnabled2}
                            className={`${enabled2 ? 'bg-indigo-600' : 'bg-gray-300'}
                              relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
                          >
                            <span className="sr-only">Toggle approval</span>
                            <span
                              aria-hidden="true"
                              className={`${enabled2 ? 'translate-x-[20px]' : 'translate-x-0'}
                                pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                            />
                          </Switch>
                        <button className="bg-orange-400 hover:bg-orange-500 text-white p-1.5 rounded shadow-sm">
                          <Undo2 size={16} />
                        </button>
                      </div>
                    </div>
                    {/* Baris Disetujui */}
                    <div className="flex flex-1 bg-green-50/30">
                      <div className="flex-1 border-r border-t border-gray-200 p-3 flex items-center justify-center"></div>
                      <div className="flex-1 border-r border-t border-gray-200 p-3 flex items-center justify-center"></div>
                      <div className="flex-1 border-r border-t border-gray-200 p-3 flex items-center justify-center"></div>
                      <div className="flex-1 border-r border-t border-gray-200 p-3 flex items-center justify-center"></div>
                      <div className="flex-1 border-r border-t border-gray-200 p-3 flex items-center justify-center"></div>
                      <div className="w-32 p-3 border-t border-gray-200 flex items-center justify-center"></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
