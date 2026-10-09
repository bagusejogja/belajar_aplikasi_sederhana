// Format Struktur Lampiran RKA Kementrian (Sesuai tempalte lamproran.xlsx)
export interface LampiranRkaRow {
  id: string;
  no: string;
  uraian: string;
  volume: number | null;
  satuan: string;
  tarif: number | null;
  targetBiaya: number | null;
  block: string;
  romawi: string;
  level: number;
  isBlock: boolean;
  isHeader: boolean;
  matchKeys: string[];
}

export const LAMPIRAN_RKA_TEMPLATE: LampiranRkaRow[] = [
  {
    "id": "lrka_1",
    "no": "",
    "uraian": "RUPIAH MURNI (RM)",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 494508254000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "",
    "level": 0,
    "isBlock": true,
    "isHeader": false,
    "matchKeys": [
      "rupiah murni (rm)"
    ]
  },
  {
    "id": "lrka_2",
    "no": "I",
    "uraian": "Gaji dan Tunjangan",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": null,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 1,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "gaji dan tunjangan",
      "i gaji dan tunjangan"
    ]
  },
  {
    "id": "lrka_3",
    "no": "A",
    "uraian": "Pembayaran gaji dan tunjangan",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 494508254000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "pembayaran gaji dan tunjangan",
      "a pembayaran gaji dan tunjangan"
    ]
  },
  {
    "id": "lrka_4",
    "no": "",
    "uraian": "Belanja Gaji Pokok PNS",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 212090929000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja gaji pokok pns"
    ]
  },
  {
    "id": "lrka_5",
    "no": "",
    "uraian": "- Belanja Gaji Pokok PNS",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 182140183000,
    "targetBiaya": 182140183000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja gaji pokok pns",
      "- belanja gaji pokok pns"
    ]
  },
  {
    "id": "lrka_6",
    "no": "",
    "uraian": "- Belanja Gaji Pokok PNS (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 14975373000,
    "targetBiaya": 14975373000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja gaji pokok pns (gaji ke 13)",
      "- belanja gaji pokok pns (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_7",
    "no": "",
    "uraian": "- Belanja Gaji Pokok PNS (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 14975373000,
    "targetBiaya": 14975373000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja gaji pokok pns (gaji ke 14)",
      "- belanja gaji pokok pns (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_8",
    "no": "",
    "uraian": "Belanja Pembulatan Gaji PNS",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 2871000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja pembulatan gaji pns"
    ]
  },
  {
    "id": "lrka_9",
    "no": "",
    "uraian": "- Belanja Pembulatan Gaji PNS",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 2461000,
    "targetBiaya": 2461000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja pembulatan gaji pns",
      "- belanja pembulatan gaji pns"
    ]
  },
  {
    "id": "lrka_10",
    "no": "",
    "uraian": "- Belanja Pembulatan Gaji PNS (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 205000,
    "targetBiaya": 205000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja pembulatan gaji pns (gaji ke 13)",
      "- belanja pembulatan gaji pns (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_11",
    "no": "",
    "uraian": "- Belanja Pembulatan Gaji PNS (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 205000,
    "targetBiaya": 205000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja pembulatan gaji pns (gaji ke 14)",
      "- belanja pembulatan gaji pns (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_12",
    "no": "",
    "uraian": "Belanja Tunj. Suami/Istri PNS",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 17012673000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. suami/istri pns"
    ]
  },
  {
    "id": "lrka_13",
    "no": "",
    "uraian": "- Belanja Tunj. Suami/Istri PNS",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 14439435000,
    "targetBiaya": 14439435000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. suami/istri pns",
      "- belanja tunj. suami/istri pns"
    ]
  },
  {
    "id": "lrka_14",
    "no": "",
    "uraian": "- Belanja Tunj. Suami/Istri PNS (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 1286619000,
    "targetBiaya": 1286619000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. suami/istri pns (gaji ke 13)",
      "- belanja tunj. suami/istri pns (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_15",
    "no": "",
    "uraian": "- Belanja Tunj. Suami/Istri PNS (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 1286619000,
    "targetBiaya": 1286619000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. suami/istri pns (gaji ke 14)",
      "- belanja tunj. suami/istri pns (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_16",
    "no": "",
    "uraian": "Belanja Tunj. Anak PNS",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 4808359000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. anak pns"
    ]
  },
  {
    "id": "lrka_17",
    "no": "",
    "uraian": "- Belanja Tunj.Anak PNS",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 4121451000,
    "targetBiaya": 4121451000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj.anak pns",
      "- belanja tunj.anak pns"
    ]
  },
  {
    "id": "lrka_18",
    "no": "",
    "uraian": "- Belanja Tunj. Anak PNS (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 343454000,
    "targetBiaya": 343454000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. anak pns (gaji ke 13)",
      "- belanja tunj. anak pns (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_19",
    "no": "",
    "uraian": "- Belanja Tunj. Anak PNS (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 343454000,
    "targetBiaya": 343454000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. anak pns (gaji ke 14)",
      "- belanja tunj. anak pns (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_20",
    "no": "",
    "uraian": "Belanja Tunj. Fungsional PNS",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 24402922000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. fungsional pns"
    ]
  },
  {
    "id": "lrka_21",
    "no": "",
    "uraian": "- Belanja Tunjangan Fungsional PNS",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 20773934000,
    "targetBiaya": 20773934000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan fungsional pns",
      "- belanja tunjangan fungsional pns"
    ]
  },
  {
    "id": "lrka_22",
    "no": "",
    "uraian": "- Belanja Tunjangan Fungsional PNS (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 1814494000,
    "targetBiaya": 1814494000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan fungsional pns (gaji ke 13)",
      "- belanja tunjangan fungsional pns (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_23",
    "no": "",
    "uraian": "- Belanja Tunjangan Fungsional PNS (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 1814494000,
    "targetBiaya": 1814494000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan fungsional pns (gaji ke 14)",
      "- belanja tunjangan fungsional pns (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_24",
    "no": "",
    "uraian": "Belanja Tunj. PPh PNS",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 3619139000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. pph pns"
    ]
  },
  {
    "id": "lrka_25",
    "no": "",
    "uraian": "- Belanja Tunjangan PPh PNS",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 1140817000,
    "targetBiaya": 1140817000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan pph pns",
      "- belanja tunjangan pph pns"
    ]
  },
  {
    "id": "lrka_26",
    "no": "",
    "uraian": "- Belanja Tunjangan PPh PNS (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 1239161000,
    "targetBiaya": 1239161000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan pph pns (gaji ke 13)",
      "- belanja tunjangan pph pns (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_27",
    "no": "",
    "uraian": "- Belanja Tunjangan PPh PNS (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 1239161000,
    "targetBiaya": 1239161000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan pph pns (gaji ke 14)",
      "- belanja tunjangan pph pns (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_28",
    "no": "",
    "uraian": "Belanja Tunj. Beras PNS",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 10711983000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. beras pns"
    ]
  },
  {
    "id": "lrka_29",
    "no": "",
    "uraian": "- Belanja Tunj Beras PNS",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 9181701000,
    "targetBiaya": 9181701000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj beras pns",
      "- belanja tunj beras pns"
    ]
  },
  {
    "id": "lrka_30",
    "no": "",
    "uraian": "- Belanja Tunj. Beras  PNS (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 765141000,
    "targetBiaya": 765141000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. beras  pns (gaji ke 13)",
      "- belanja tunj. beras  pns (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_31",
    "no": "",
    "uraian": "- Belanja Tunj. Beras  PNS (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 765141000,
    "targetBiaya": 765141000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. beras  pns (gaji ke 14)",
      "- belanja tunj. beras  pns (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_32",
    "no": "",
    "uraian": "Belanja Uang Makan PNS",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 27100000000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja uang makan pns"
    ]
  },
  {
    "id": "lrka_33",
    "no": "",
    "uraian": "- Belanja Uang Makan PNS",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 27100000000,
    "targetBiaya": 27100000000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja uang makan pns",
      "- belanja uang makan pns"
    ]
  },
  {
    "id": "lrka_34",
    "no": "",
    "uraian": "Belanja Tunj. Tugas Belajar Tenaga Pengajar Biasa pada PT untuk mengikuti pendidikan Pasca Sarjana PNS",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 135575000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. tugas belajar tenaga pengajar biasa pada pt untuk mengikuti pendidikan pasca sarjana pns"
    ]
  },
  {
    "id": "lrka_35",
    "no": "",
    "uraian": "- Belanja Tunj. Tugas Belajar Tenaga Pengajar Biasa pada PT untuk mengikuti pendidikan Pasca Sarjana PNS",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 135575000,
    "targetBiaya": 135575000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. tugas belajar tenaga pengajar biasa pada pt untuk mengikuti pendidikan pasca sarjana pns",
      "- belanja tunj. tugas belajar tenaga pengajar biasa pada pt untuk mengikuti pendidikan pasca sarjana pns"
    ]
  },
  {
    "id": "lrka_36",
    "no": "",
    "uraian": "Belanja Tunjangan Umum PNS",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 4600363000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan umum pns"
    ]
  },
  {
    "id": "lrka_37",
    "no": "",
    "uraian": "- Belanja Tunjangan Umum PNS",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 3967741000,
    "targetBiaya": 3967741000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan umum pns",
      "- belanja tunjangan umum pns"
    ]
  },
  {
    "id": "lrka_38",
    "no": "",
    "uraian": "- Belanja Tunjangan Umum PNS (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 316311000,
    "targetBiaya": 316311000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan umum pns (gaji ke 13)",
      "- belanja tunjangan umum pns (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_39",
    "no": "",
    "uraian": "- Belanja Tunjangan Umum PNS (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 316311000,
    "targetBiaya": 316311000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan umum pns (gaji ke 14)",
      "- belanja tunjangan umum pns (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_40",
    "no": "",
    "uraian": "Belanja Tunjangan Profesi Dosen",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 95117007000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan profesi dosen"
    ]
  },
  {
    "id": "lrka_41",
    "no": "",
    "uraian": "- Tunjangan Profesi Dosen PNS Non Guru Besar",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 76679729000,
    "targetBiaya": 76679729000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "tunjangan profesi dosen pns non guru besar",
      "- tunjangan profesi dosen pns non guru besar"
    ]
  },
  {
    "id": "lrka_42",
    "no": "",
    "uraian": "- Tunjangan Profesi Dosen PNS Guru Besar",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 18437278000,
    "targetBiaya": 18437278000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "tunjangan profesi dosen pns guru besar",
      "- tunjangan profesi dosen pns guru besar"
    ]
  },
  {
    "id": "lrka_43",
    "no": "",
    "uraian": "Belanja Tunjangan Kehormatan Profesor",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 69372715000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan kehormatan profesor"
    ]
  },
  {
    "id": "lrka_44",
    "no": "",
    "uraian": "- Tunjangan Kehormatan Guru Besar PNS Tahun 2026",
    "volume": 1,
    "satuan": "Tulan",
    "tarif": 69372715000,
    "targetBiaya": 69372715000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "tunjangan kehormatan guru besar pns tahun 2026",
      "- tunjangan kehormatan guru besar pns tahun 2026"
    ]
  },
  {
    "id": "lrka_45",
    "no": "",
    "uraian": "Belanja Tunjangan Tenaga Pendidik Non PNS",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 13881831000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan tenaga pendidik non pns"
    ]
  },
  {
    "id": "lrka_46",
    "no": "",
    "uraian": "- Tunjangan Profesi Dosen Non PNS Tahun 2026",
    "volume": 1,
    "satuan": "Tulan",
    "tarif": 13041831000,
    "targetBiaya": 13041831000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "tunjangan profesi dosen non pns tahun 2026",
      "- tunjangan profesi dosen non pns tahun 2026"
    ]
  },
  {
    "id": "lrka_47",
    "no": "",
    "uraian": "- Tunjangan Profesi Guru Besar Non PNS Tahun 2026",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 190000000,
    "targetBiaya": 190000000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "tunjangan profesi guru besar non pns tahun 2026",
      "- tunjangan profesi guru besar non pns tahun 2026"
    ]
  },
  {
    "id": "lrka_48",
    "no": "",
    "uraian": "- Tunjangan Kehormatan Guru Besar Non PNS Tahun 2026",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 650000000,
    "targetBiaya": 650000000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "tunjangan kehormatan guru besar non pns tahun 2026",
      "- tunjangan kehormatan guru besar non pns tahun 2026"
    ]
  },
  {
    "id": "lrka_49",
    "no": "",
    "uraian": "Belanja Gaji Pokok PPPK",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 7956629000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja gaji pokok pppk"
    ]
  },
  {
    "id": "lrka_50",
    "no": "",
    "uraian": "- Belanja Gaji Pokok PPPK",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 6819969000,
    "targetBiaya": 6819969000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja gaji pokok pppk",
      "- belanja gaji pokok pppk"
    ]
  },
  {
    "id": "lrka_51",
    "no": "",
    "uraian": "- Belanja Gaji Pokok PPPK (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 568330000,
    "targetBiaya": 568330000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja gaji pokok pppk (gaji ke 13)",
      "- belanja gaji pokok pppk (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_52",
    "no": "",
    "uraian": "- Belanja Gaji Pokok PPPK (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 568330000,
    "targetBiaya": 568330000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja gaji pokok pppk (gaji ke 14)",
      "- belanja gaji pokok pppk (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_53",
    "no": "",
    "uraian": "Belanja Pembulatan Gaji PPPK",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 1400000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja pembulatan gaji pppk"
    ]
  },
  {
    "id": "lrka_54",
    "no": "",
    "uraian": "- Belanja Pembulatan Gaji PPPK",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 1200000,
    "targetBiaya": 1200000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja pembulatan gaji pppk",
      "- belanja pembulatan gaji pppk"
    ]
  },
  {
    "id": "lrka_55",
    "no": "",
    "uraian": "- Belanja Pembulatan Gaji PPPK (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 100000,
    "targetBiaya": 100000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja pembulatan gaji pppk (gaji ke 13)",
      "- belanja pembulatan gaji pppk (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_56",
    "no": "",
    "uraian": "- Belanja Pembulatan Gaji PPPK (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 100000,
    "targetBiaya": 100000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja pembulatan gaji pppk (gaji ke 14)",
      "- belanja pembulatan gaji pppk (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_57",
    "no": "",
    "uraian": "Belanja Tunjangan Suami/Istri PPPK",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 795662000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan suami/istri pppk"
    ]
  },
  {
    "id": "lrka_58",
    "no": "",
    "uraian": "- Belanja Tunj. Suami/Istri PPPK",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 681996000,
    "targetBiaya": 681996000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. suami/istri pppk",
      "- belanja tunj. suami/istri pppk"
    ]
  },
  {
    "id": "lrka_59",
    "no": "",
    "uraian": "- Belanja Tunj. Suami/Istri PPPK (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 56833000,
    "targetBiaya": 56833000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. suami/istri pppk (gaji ke 13)",
      "- belanja tunj. suami/istri pppk (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_60",
    "no": "",
    "uraian": "- Belanja Tunj. Suami/Istri PPPK (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 56833000,
    "targetBiaya": 56833000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. suami/istri pppk (gaji ke 14)",
      "- belanja tunj. suami/istri pppk (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_61",
    "no": "",
    "uraian": "Belanja Tunjangan Anak PPPK",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 318264000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan anak pppk"
    ]
  },
  {
    "id": "lrka_62",
    "no": "",
    "uraian": "- Belanja Tunj.Anak PPPK",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 272798000,
    "targetBiaya": 272798000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj.anak pppk",
      "- belanja tunj.anak pppk"
    ]
  },
  {
    "id": "lrka_63",
    "no": "",
    "uraian": "- Belanja Tunj. Anak PPPK (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 22733000,
    "targetBiaya": 22733000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. anak pppk (gaji ke 13)",
      "- belanja tunj. anak pppk (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_64",
    "no": "",
    "uraian": "- Belanja Tunj. Anak PPPK (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 22733000,
    "targetBiaya": 22733000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. anak pppk (gaji ke 14)",
      "- belanja tunj. anak pppk (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_65",
    "no": "",
    "uraian": "Belanja Tunjangan Fungsional PPPK",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 803316000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan fungsional pppk"
    ]
  },
  {
    "id": "lrka_66",
    "no": "",
    "uraian": "- Belanja Tunj. Fungsional PPPK",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 696864000,
    "targetBiaya": 696864000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. fungsional pppk",
      "- belanja tunj. fungsional pppk"
    ]
  },
  {
    "id": "lrka_67",
    "no": "",
    "uraian": "- Belanja Tunj. Fungsional PPPK (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 53226000,
    "targetBiaya": 53226000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. fungsional pppk (gaji ke 13)",
      "- belanja tunj. fungsional pppk (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_68",
    "no": "",
    "uraian": "- Belanja Tunj. Fungsional PPPK (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 53226000,
    "targetBiaya": 53226000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj. fungsional pppk (gaji ke 14)",
      "- belanja tunj. fungsional pppk (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_69",
    "no": "",
    "uraian": "Belanja Tunjangan Beras PPPK",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 450000000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunjangan beras pppk"
    ]
  },
  {
    "id": "lrka_70",
    "no": "",
    "uraian": "- Belanja Tunj Beras PPPK",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 390258000,
    "targetBiaya": 390258000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj beras pppk",
      "- belanja tunj beras pppk"
    ]
  },
  {
    "id": "lrka_71",
    "no": "",
    "uraian": "- Belanja Tunj Beras PPPK (gaji ke 13)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 29871000,
    "targetBiaya": 29871000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj beras pppk (gaji ke 13)",
      "- belanja tunj beras pppk (gaji ke 13)"
    ]
  },
  {
    "id": "lrka_72",
    "no": "",
    "uraian": "- Belanja Tunj Beras PPPK (gaji ke 14)",
    "volume": 1,
    "satuan": "Bulan",
    "tarif": 29871000,
    "targetBiaya": 29871000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja tunj beras pppk (gaji ke 14)",
      "- belanja tunj beras pppk (gaji ke 14)"
    ]
  },
  {
    "id": "lrka_73",
    "no": "",
    "uraian": "Belanja Uang Makan PPPK",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 1326616000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja uang makan pppk"
    ]
  },
  {
    "id": "lrka_74",
    "no": "",
    "uraian": "- Belanja Uang Makan PPPK",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 1326616000,
    "targetBiaya": 1326616000,
    "block": "RUPIAH MURNI (RM)",
    "romawi": "I",
    "level": 4,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "belanja uang makan pppk",
      "- belanja uang makan pppk"
    ]
  },
  {
    "id": "lrka_76",
    "no": "",
    "uraian": "BPPTNBH",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 172942300000,
    "block": "BPPTNBH",
    "romawi": "",
    "level": 0,
    "isBlock": true,
    "isHeader": false,
    "matchKeys": [
      "bpptnbh"
    ]
  },
  {
    "id": "lrka_77",
    "no": "I",
    "uraian": "OPERASIONAL",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 25935400000,
    "block": "BPPTNBH",
    "romawi": "I",
    "level": 1,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "operasional",
      "i operasional"
    ]
  },
  {
    "id": "lrka_78",
    "no": "",
    "uraian": "Pengelolaan Manajemen",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": null,
    "block": "BPPTNBH",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "pengelolaan manajemen"
    ]
  },
  {
    "id": "lrka_79",
    "no": "",
    "uraian": "1. Biaya Langganan Listrik",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 25887400000,
    "targetBiaya": 25887400000,
    "block": "BPPTNBH",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "biaya langganan listrik",
      "1. biaya langganan listrik"
    ]
  },
  {
    "id": "lrka_80",
    "no": "",
    "uraian": "2. Biaya Pengoperasian dan Pemeliharaan PLTS",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 48000000,
    "targetBiaya": 48000000,
    "block": "BPPTNBH",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "biaya pengoperasian dan pemeliharaan plts",
      "2. biaya pengoperasian dan pemeliharaan plts"
    ]
  },
  {
    "id": "lrka_81",
    "no": "",
    "uraian": "3. Pendampingan PRPTN Universitas Borneo Tarakan",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 0,
    "targetBiaya": 0,
    "block": "BPPTNBH",
    "romawi": "I",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "pendampingan prptn universitas borneo tarakan",
      "3. pendampingan prptn universitas borneo tarakan"
    ]
  },
  {
    "id": "lrka_82",
    "no": "II",
    "uraian": "BIAYA DOSEN NON ASN",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 72293649736,
    "block": "BPPTNBH",
    "romawi": "II",
    "level": 1,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "biaya dosen non asn",
      "ii biaya dosen non asn"
    ]
  },
  {
    "id": "lrka_83",
    "no": "",
    "uraian": "1. Gaji dan tunjangan",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 72293649736,
    "targetBiaya": 72293649736,
    "block": "BPPTNBH",
    "romawi": "II",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "gaji dan tunjangan",
      "1. gaji dan tunjangan",
      "gaji dosen tetap fakultas",
      "gaji dosen non asn",
      "1. gaji dan tunjangan dosen"
    ]
  },
  {
    "id": "lrka_84",
    "no": "",
    "uraian": "2. Tunjangan jabatan akademik",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 0,
    "targetBiaya": 0,
    "block": "BPPTNBH",
    "romawi": "II",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "tunjangan jabatan akademik",
      "2. tunjangan jabatan akademik"
    ]
  },
  {
    "id": "lrka_85",
    "no": "",
    "uraian": "3. Tunjangan Profesi",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 0,
    "targetBiaya": 0,
    "block": "BPPTNBH",
    "romawi": "II",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "tunjangan profesi",
      "3. tunjangan profesi"
    ]
  },
  {
    "id": "lrka_86",
    "no": "",
    "uraian": "4. Tunjangan Kehormatan",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 0,
    "targetBiaya": 0,
    "block": "BPPTNBH",
    "romawi": "II",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "tunjangan kehormatan",
      "4. tunjangan kehormatan"
    ]
  },
  {
    "id": "lrka_87",
    "no": "",
    "uraian": "5. Uang Makan",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 0,
    "targetBiaya": 0,
    "block": "BPPTNBH",
    "romawi": "II",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "uang makan",
      "5. uang makan"
    ]
  },
  {
    "id": "lrka_88",
    "no": "",
    "uraian": "6. Honorarium",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 0,
    "targetBiaya": 0,
    "block": "BPPTNBH",
    "romawi": "II",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "honorarium",
      "6. honorarium"
    ]
  },
  {
    "id": "lrka_89",
    "no": "III",
    "uraian": "BIAYA TENAGA KEPENDIDIKAN NON ASN",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 74713250264,
    "block": "BPPTNBH",
    "romawi": "III",
    "level": 1,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "biaya tenaga kependidikan non asn",
      "iii biaya tenaga kependidikan non asn"
    ]
  },
  {
    "id": "lrka_90",
    "no": "",
    "uraian": "1. Gaji dan tunjangan tendik",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 35260652238,
    "targetBiaya": 35260652238,
    "block": "BPPTNBH",
    "romawi": "III",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "gaji dan tunjangan tendik",
      "1. gaji dan tunjangan tendik",
      "gaji pegawai pegawai non asn",
      "gaji pegawai non asn",
      "gaji tendik non asn"
    ]
  },
  {
    "id": "lrka_91",
    "no": "",
    "uraian": "2. Uang Makan",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 2702598026,
    "targetBiaya": 2702598026,
    "block": "BPPTNBH",
    "romawi": "III",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "uang makan",
      "2. uang makan"
    ]
  },
  {
    "id": "lrka_92",
    "no": "",
    "uraian": "3. Tunjangan Kinerja",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 36750000000,
    "targetBiaya": 36750000000,
    "block": "BPPTNBH",
    "romawi": "III",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "tunjangan kinerja",
      "3. tunjangan kinerja"
    ]
  },
  {
    "id": "lrka_93",
    "no": "IV",
    "uraian": "BIAYA INVESTASI",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 0,
    "block": "BPPTNBH",
    "romawi": "IV",
    "level": 1,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "biaya investasi",
      "iv biaya investasi"
    ]
  },
  {
    "id": "lrka_94",
    "no": "V",
    "uraian": "BIAYA PENGEMBANGAN",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 0,
    "block": "BPPTNBH",
    "romawi": "V",
    "level": 1,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "biaya pengembangan",
      "v biaya pengembangan"
    ]
  },
  {
    "id": "lrka_96",
    "no": "",
    "uraian": "ALOKASI DARI KEMENDIKTISAINTEK LAINNYA",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 56044621880,
    "block": "ALOKASI DARI KEMENDIKTISAINTEK LAINNYA",
    "romawi": "",
    "level": 0,
    "isBlock": true,
    "isHeader": false,
    "matchKeys": [
      "alokasi dari kemendiktisaintek lainnya"
    ]
  },
  {
    "id": "lrka_97",
    "no": "",
    "uraian": "1. Hibah PUAPT",
    "volume": 0,
    "satuan": "Tahun",
    "tarif": 0,
    "targetBiaya": 0,
    "block": "ALOKASI DARI KEMENDIKTISAINTEK LAINNYA",
    "romawi": "",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "hibah puapt",
      "1. hibah puapt"
    ]
  },
  {
    "id": "lrka_98",
    "no": "",
    "uraian": "2. Penelitian",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 49745121880,
    "targetBiaya": 49745121880,
    "block": "ALOKASI DARI KEMENDIKTISAINTEK LAINNYA",
    "romawi": "",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "penelitian",
      "2. penelitian"
    ]
  },
  {
    "id": "lrka_99",
    "no": "",
    "uraian": "3. Beasiswa dari Pemerintah",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 6299500000,
    "targetBiaya": 6299500000,
    "block": "ALOKASI DARI KEMENDIKTISAINTEK LAINNYA",
    "romawi": "",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "beasiswa dari pemerintah",
      "3. beasiswa dari pemerintah"
    ]
  },
  {
    "id": "lrka_101",
    "no": "",
    "uraian": "ALOKASI DARI K/L LAINNYA",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 198939285850,
    "block": "ALOKASI DARI K/L LAINNYA",
    "romawi": "",
    "level": 0,
    "isBlock": true,
    "isHeader": false,
    "matchKeys": [
      "alokasi dari k/l lainnya"
    ]
  },
  {
    "id": "lrka_102",
    "no": "",
    "uraian": "1. Equity",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 0,
    "targetBiaya": 77200000000,
    "block": "ALOKASI DARI K/L LAINNYA",
    "romawi": "",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "equity",
      "1. equity"
    ]
  },
  {
    "id": "lrka_103",
    "no": "",
    "uraian": "2. Penelitian K/L lainnya",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 0,
    "targetBiaya": 0,
    "block": "ALOKASI DARI K/L LAINNYA",
    "romawi": "",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "penelitian k/l lainnya",
      "2. penelitian k/l lainnya"
    ]
  },
  {
    "id": "lrka_104",
    "no": "",
    "uraian": "3. Dana Beasiswa dan Kontrak Kerjasama Pemerintah",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 0,
    "targetBiaya": 0,
    "block": "ALOKASI DARI K/L LAINNYA",
    "romawi": "",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "dana beasiswa dan kontrak kerjasama pemerintah",
      "3. dana beasiswa dan kontrak kerjasama pemerintah"
    ]
  },
  {
    "id": "lrka_105",
    "no": "",
    "uraian": "4. Kerjasama dengan Pemerintah",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 121739285850,
    "targetBiaya": 121739285850,
    "block": "ALOKASI DARI K/L LAINNYA",
    "romawi": "",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "kerjasama dengan pemerintah",
      "4. kerjasama dengan pemerintah"
    ]
  },
  {
    "id": "lrka_107",
    "no": "",
    "uraian": "PLN/HLN/RMP/SBSN/KPBU",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 48070000000,
    "block": "PLN/HLN/RMP/SBSN/KPBU",
    "romawi": "",
    "level": 0,
    "isBlock": true,
    "isHeader": false,
    "matchKeys": [
      "pln/hln/rmp/sbsn/kpbu"
    ]
  },
  {
    "id": "lrka_108",
    "no": "",
    "uraian": "Hibah Science Techno Park - ADB (Prime Step)",
    "volume": 1,
    "satuan": "Tahun",
    "tarif": 48070000000,
    "targetBiaya": 48070000000,
    "block": "PLN/HLN/RMP/SBSN/KPBU",
    "romawi": "",
    "level": 3,
    "isBlock": false,
    "isHeader": false,
    "matchKeys": [
      "hibah science techno park - adb (prime step)"
    ]
  },
  {
    "id": "lrka_111",
    "no": "",
    "uraian": "SELAIN APBN",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 3147341267028,
    "block": "SELAIN APBN",
    "romawi": "",
    "level": 0,
    "isBlock": true,
    "isHeader": false,
    "matchKeys": [
      "selain apbn"
    ]
  },
  {
    "id": "lrka_112",
    "no": "I",
    "uraian": "OPERASIONAL",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 1227363231371,
    "block": "SELAIN APBN",
    "romawi": "I",
    "level": 1,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "operasional",
      "i operasional"
    ]
  },
  {
    "id": "lrka_113",
    "no": "I.A.",
    "uraian": "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 383998140911,
    "block": "SELAIN APBN",
    "romawi": "I",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      "i.a. mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif"
    ]
  },
  {
    "id": "lrka_114",
    "no": "I.B.",
    "uraian": "Mewujudkan reputasi akademik yang unggul melalui penelitian translasional yang inovatif, produktif, dan berdampak bagi masyarakat",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 309341102094,
    "block": "SELAIN APBN",
    "romawi": "I",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan reputasi akademik yang unggul melalui penelitian translasional yang inovatif, produktif, dan berdampak bagi masyarakat",
      "i.b. mewujudkan reputasi akademik yang unggul melalui penelitian translasional yang inovatif, produktif, dan berdampak bagi masyarakat"
    ]
  },
  {
    "id": "lrka_115",
    "no": "I.C.",
    "uraian": "Mewujudkan pengabdian kepada masyarakat yang berkualitas, komprehensif dan berkesinambungan",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 34834842884,
    "block": "SELAIN APBN",
    "romawi": "I",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan pengabdian kepada masyarakat yang berkualitas, komprehensif dan berkesinambungan",
      "i.c. mewujudkan pengabdian kepada masyarakat yang berkualitas, komprehensif dan berkesinambungan"
    ]
  },
  {
    "id": "lrka_116",
    "no": "I.D.",
    "uraian": "Menjamin tata kelola universitas yang dinamis, terintegrasi, dan berkelanjutan",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 374873063922,
    "block": "SELAIN APBN",
    "romawi": "I",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "menjamin tata kelola universitas yang dinamis, terintegrasi, dan berkelanjutan",
      "i.d. menjamin tata kelola universitas yang dinamis, terintegrasi, dan berkelanjutan"
    ]
  },
  {
    "id": "lrka_117",
    "no": "I.E.",
    "uraian": "Mewujudkan atmosfer kampus yang sehat, ramah lingkungan, berbudaya dan bertanggungjawab secara sosial",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 124316081560,
    "block": "SELAIN APBN",
    "romawi": "I",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan atmosfer kampus yang sehat, ramah lingkungan, berbudaya dan bertanggungjawab secara sosial",
      "i.e. mewujudkan atmosfer kampus yang sehat, ramah lingkungan, berbudaya dan bertanggungjawab secara sosial"
    ]
  },
  {
    "id": "lrka_118",
    "no": "II",
    "uraian": "BIAYA DOSEN NON PNS",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 278968965356,
    "block": "SELAIN APBN",
    "romawi": "II",
    "level": 1,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "biaya dosen non pns",
      "ii biaya dosen non pns"
    ]
  },
  {
    "id": "lrka_119",
    "no": "III",
    "uraian": "BIAYA TENAGA KEPENDIDIKAN NON PNS",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 152354095755,
    "block": "SELAIN APBN",
    "romawi": "III",
    "level": 1,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "biaya tenaga kependidikan non pns",
      "iii biaya tenaga kependidikan non pns"
    ]
  },
  {
    "id": "lrka_120",
    "no": "IV",
    "uraian": "INVESTASI",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 713371838093,
    "block": "SELAIN APBN",
    "romawi": "IV",
    "level": 1,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "investasi",
      "iv investasi"
    ]
  },
  {
    "id": "lrka_121",
    "no": "IV.A.",
    "uraian": "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 80477595868,
    "block": "SELAIN APBN",
    "romawi": "IV",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      "iv.a. mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif"
    ]
  },
  {
    "id": "lrka_122",
    "no": "IV.B.",
    "uraian": "Mewujudkan reputasi akademik yang unggul melalui penelitian translasional yang inovatif, produktif, dan berdampak bagi masyarakat",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 10086047806,
    "block": "SELAIN APBN",
    "romawi": "IV",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan reputasi akademik yang unggul melalui penelitian translasional yang inovatif, produktif, dan berdampak bagi masyarakat",
      "iv.b. mewujudkan reputasi akademik yang unggul melalui penelitian translasional yang inovatif, produktif, dan berdampak bagi masyarakat"
    ]
  },
  {
    "id": "lrka_123",
    "no": "IV.C.",
    "uraian": "Mewujudkan pengabdian kepada masyarakat yang berkualitas, komprehensif dan berkesinambungan",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 112353801,
    "block": "SELAIN APBN",
    "romawi": "IV",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan pengabdian kepada masyarakat yang berkualitas, komprehensif dan berkesinambungan",
      "iv.c. mewujudkan pengabdian kepada masyarakat yang berkualitas, komprehensif dan berkesinambungan"
    ]
  },
  {
    "id": "lrka_124",
    "no": "IV.D.",
    "uraian": "Menjamin tata kelola universitas yang dinamis, terintegrasi, dan berkelanjutan",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 324655419000,
    "block": "SELAIN APBN",
    "romawi": "IV",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "menjamin tata kelola universitas yang dinamis, terintegrasi, dan berkelanjutan",
      "iv.d. menjamin tata kelola universitas yang dinamis, terintegrasi, dan berkelanjutan"
    ]
  },
  {
    "id": "lrka_125",
    "no": "IV.E.",
    "uraian": "Mewujudkan atmosfer kampus yang sehat, ramah lingkungan, berbudaya dan bertanggungjawab secara sosial",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 298040421618,
    "block": "SELAIN APBN",
    "romawi": "IV",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan atmosfer kampus yang sehat, ramah lingkungan, berbudaya dan bertanggungjawab secara sosial",
      "iv.e. mewujudkan atmosfer kampus yang sehat, ramah lingkungan, berbudaya dan bertanggungjawab secara sosial"
    ]
  },
  {
    "id": "lrka_126",
    "no": "V",
    "uraian": "PENGEMBANGAN",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 181052197823,
    "block": "SELAIN APBN",
    "romawi": "V",
    "level": 1,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "pengembangan",
      "v pengembangan"
    ]
  },
  {
    "id": "lrka_127",
    "no": "V.A.",
    "uraian": "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 93831128481,
    "block": "SELAIN APBN",
    "romawi": "V",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      "v.a. mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif"
    ]
  },
  {
    "id": "lrka_128",
    "no": "V.B.",
    "uraian": "Mewujudkan reputasi akademik yang unggul melalui penelitian translasional yang inovatif, produktif, dan berdampak bagi masyarakat",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 23999988670,
    "block": "SELAIN APBN",
    "romawi": "V",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan reputasi akademik yang unggul melalui penelitian translasional yang inovatif, produktif, dan berdampak bagi masyarakat",
      "v.b. mewujudkan reputasi akademik yang unggul melalui penelitian translasional yang inovatif, produktif, dan berdampak bagi masyarakat"
    ]
  },
  {
    "id": "lrka_129",
    "no": "V.C.",
    "uraian": "Mewujudkan pengabdian kepada masyarakat yang berkualitas, komprehensif dan berkesinambungan",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 23743590622,
    "block": "SELAIN APBN",
    "romawi": "V",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan pengabdian kepada masyarakat yang berkualitas, komprehensif dan berkesinambungan",
      "v.c. mewujudkan pengabdian kepada masyarakat yang berkualitas, komprehensif dan berkesinambungan"
    ]
  },
  {
    "id": "lrka_130",
    "no": "V.D.",
    "uraian": "Menjamin tata kelola universitas yang dinamis, terintegrasi, dan berkelanjutan",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 38944090050,
    "block": "SELAIN APBN",
    "romawi": "V",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "menjamin tata kelola universitas yang dinamis, terintegrasi, dan berkelanjutan",
      "v.d. menjamin tata kelola universitas yang dinamis, terintegrasi, dan berkelanjutan"
    ]
  },
  {
    "id": "lrka_131",
    "no": "V.E.",
    "uraian": "Mewujudkan atmosfer kampus yang sehat, ramah lingkungan, berbudaya dan bertanggungjawab secara sosial",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 533400000,
    "block": "SELAIN APBN",
    "romawi": "V",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan atmosfer kampus yang sehat, ramah lingkungan, berbudaya dan bertanggungjawab secara sosial",
      "v.e. mewujudkan atmosfer kampus yang sehat, ramah lingkungan, berbudaya dan bertanggungjawab secara sosial"
    ]
  },
  {
    "id": "lrka_132",
    "no": "VI",
    "uraian": "REMUNERASI",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 594230938630,
    "block": "SELAIN APBN",
    "romawi": "VI",
    "level": 1,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "remunerasi",
      "vi remunerasi"
    ]
  },
  {
    "id": "lrka_133",
    "no": "VI.A.",
    "uraian": "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif Pelaksanaan Perkuliahan",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 2987536000,
    "block": "SELAIN APBN",
    "romawi": "VI",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif pelaksanaan perkuliahan",
      "vi.a. mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif pelaksanaan perkuliahan"
    ]
  },
  {
    "id": "lrka_134",
    "no": "VI.B.",
    "uraian": "Mewujudkan reputasi akademik yang unggul melalui penelitian translasional yang inovatif, produktif, dan berdampak bagi masyarakat Pemasaran agresif untuk peningkatan omzet buku dan barang cetak lainnya",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 10408268900,
    "block": "SELAIN APBN",
    "romawi": "VI",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan reputasi akademik yang unggul melalui penelitian translasional yang inovatif, produktif, dan berdampak bagi masyarakat pemasaran agresif untuk peningkatan omzet buku dan barang cetak lainnya",
      "vi.b. mewujudkan reputasi akademik yang unggul melalui penelitian translasional yang inovatif, produktif, dan berdampak bagi masyarakat pemasaran agresif untuk peningkatan omzet buku dan barang cetak lainnya"
    ]
  },
  {
    "id": "lrka_135",
    "no": "VI.C.",
    "uraian": "Mewujudkan pengabdian kepada masyarakat yang berkualitas, komprehensif dan berkesinambungan",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 150700000,
    "block": "SELAIN APBN",
    "romawi": "VI",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan pengabdian kepada masyarakat yang berkualitas, komprehensif dan berkesinambungan",
      "vi.c. mewujudkan pengabdian kepada masyarakat yang berkualitas, komprehensif dan berkesinambungan"
    ]
  },
  {
    "id": "lrka_136",
    "no": "VI.D.",
    "uraian": "Menjamin tata kelola universitas yang dinamis, terintegrasi, dan berkelanjutan",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 572750471026,
    "block": "SELAIN APBN",
    "romawi": "VI",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "menjamin tata kelola universitas yang dinamis, terintegrasi, dan berkelanjutan",
      "vi.d. menjamin tata kelola universitas yang dinamis, terintegrasi, dan berkelanjutan"
    ]
  },
  {
    "id": "lrka_137",
    "no": "VI.E.",
    "uraian": "Mewujudkan atmosfer kampus yang sehat, ramah lingkungan, berbudaya dan bertanggungjawab secara sosial",
    "volume": null,
    "satuan": "",
    "tarif": null,
    "targetBiaya": 7933962704,
    "block": "SELAIN APBN",
    "romawi": "VI",
    "level": 2,
    "isBlock": false,
    "isHeader": true,
    "matchKeys": [
      "mewujudkan atmosfer kampus yang sehat, ramah lingkungan, berbudaya dan bertanggungjawab secara sosial",
      "vi.e. mewujudkan atmosfer kampus yang sehat, ramah lingkungan, berbudaya dan bertanggungjawab secara sosial"
    ]
  }
];

export interface ComputedLampiranRkaRow extends LampiranRkaRow {
  directPagu: number;
  directCount: number;
  directRows: any[];
  totalPagu: number;
  totalCount: number;
  allRows: any[];
}

export interface LampiranRkaResult {
  items: ComputedLampiranRkaRow[];
  unmappedRows: any[];
  grandTotal: number;
  grandCount: number;
}

export function computeLampiranRka(
  dataList: any[],
  getRowClassification?: (row: any, target: string) => string | null,
  penyesuaianList: any[] = []
): LampiranRkaResult {
  const directMap = new Map<string, ComputedLampiranRkaRow>();
  const unmappedRows: any[] = [];

  LAMPIRAN_RKA_TEMPLATE.forEach(item => {
    directMap.set(item.id, {
      ...item,
      directPagu: 0,
      directCount: 0,
      directRows: [],
      totalPagu: 0,
      totalCount: 0,
      allRows: []
    });
  });

  // Tandai elemen mana yang merupakan node daun (leaf) vs parent/induk
  const templateWithInfo = LAMPIRAN_RKA_TEMPLATE.map((it, idx, arr) => {
    const next = arr[idx + 1];
    const isLeaf = !next || next.level <= it.level;
    return { ...it, isLeaf };
  });


  const findBestMatch = (rawQuery: string, sourceRow?: any): LampiranRkaRow | null => {
    if (!rawQuery || !rawQuery.trim()) return null;
    const q = rawQuery.trim().toLowerCase();
    const qClean = q.replace(/^[-•\s]+/, '').replace(/\s+/g, ' ');

    const akun = String(sourceRow?.akun_detail || sourceRow?.kode_akun || sourceRow?.akun_utama || '').trim();
    const akunLower = akun.toLowerCase();
    const uraianLower = String(sourceRow?.uraian_belanja || '').toLowerCase();
    const kegLower = String(sourceRow?.kegiatan || sourceRow?.nama_kegiatan || '').toLowerCase();

    // Helper untuk mendeteksi digit awal kode_kegiatan (1 s/d 5) atau teks sasaran strategis/tujuan
    const getTujuanPrefix = (): string | null => {
      const kegStr = String(sourceRow?.kode_kegiatan || sourceRow?.kegiatan || sourceRow?.program || '').trim();
      const prefixMatch = kegStr.match(/^([1-5])/);
      if (prefixMatch) return prefixMatch[1];

      const tujuanStr = String(sourceRow?.tujuan || '').toLowerCase();
      if (tujuanStr.includes('pendidikan')) return '1';
      if (tujuanStr.includes('penelitian') || tujuanStr.includes('reputasi')) return '2';
      if (tujuanStr.includes('pengabdian')) return '3';
      if (tujuanStr.includes('tata kelola')) return '4';
      if (tujuanStr.includes('atmosfer') || tujuanStr.includes('ramah') || tujuanStr.includes('sehat')) return '5';
      return null;
    };

    // 1. Kasus Khusus: INVESTASI di SELAIN APBN (Kode MAK 55xxx / Belanja Modal / Tag INVESTASI)
    const isInvestasiOr55 = akun.startsWith('55') || 
                            qClean === 'investasi' || 
                            qClean === 'modal' ||
                            akunLower.includes('modal') ||
                            akunLower.includes('investasi');
    if (isInvestasiOr55) {
      const p = getTujuanPrefix();
      if (p === '1') return templateWithInfo.find(t => t.id === 'lrka_121') || null;
      if (p === '2') return templateWithInfo.find(t => t.id === 'lrka_122') || null;
      if (p === '3') return templateWithInfo.find(t => t.id === 'lrka_123') || null;
      if (p === '4') return templateWithInfo.find(t => t.id === 'lrka_124') || null;
      if (p === '5') return templateWithInfo.find(t => t.id === 'lrka_125') || null;

      const inv120 = templateWithInfo.find(t => t.id === 'lrka_120');
      if (inv120) return inv120;
    }

    // 2. Kasus Khusus: REMUNERASI di SELAIN APBN (Insentif, Tunjangan, atau Tag REMUNERASI)
    const isRemunerasi = qClean === 'remunerasi' || 
                         qClean.includes('remunerasi') ||
                         akunLower.includes('insentif') ||
                         akunLower.includes('tunjangan') ||
                         uraianLower.includes('insentif');
    // Pastikan bukan belanja gaji PNS (yang masuk pos RM)
    const isGajiPns = akunLower.includes('gaji pokok') || uraianLower.includes('pns') || uraianLower.includes('pppk');
    if (isRemunerasi && !isGajiPns) {
      const p = getTujuanPrefix();
      if (p === '1') return templateWithInfo.find(t => t.id === 'lrka_133') || null;
      if (p === '2') return templateWithInfo.find(t => t.id === 'lrka_134') || null;
      if (p === '3') return templateWithInfo.find(t => t.id === 'lrka_135') || null;
      if (p === '4') return templateWithInfo.find(t => t.id === 'lrka_136') || null;
      if (p === '5') return templateWithInfo.find(t => t.id === 'lrka_137') || null;

      const rem132 = templateWithInfo.find(t => t.id === 'lrka_132');
      if (rem132) return rem132;
    }

    // 3. Kasus Khusus: PENGEMBANGAN di SELAIN APBN (Kegiatan Pengembangan, Beasiswa, Bantuan Tridharma, atau Tag PENGEMBANGAN)
    const isPengembangan = qClean === 'pengembangan' || 
                           qClean.includes('pengembangan') ||
                           kegLower.includes('pengembangan') ||
                           akunLower.includes('beasiswa') ||
                           akunLower.includes('bantuan tridharma') ||
                           uraianLower.includes('beasiswa') ||
                           uraianLower.includes('bantuan tridharma');
    if (isPengembangan) {
      const p = getTujuanPrefix();
      if (p === '1') return templateWithInfo.find(t => t.id === 'lrka_127') || null;
      if (p === '2') return templateWithInfo.find(t => t.id === 'lrka_128') || null;
      if (p === '3') return templateWithInfo.find(t => t.id === 'lrka_129') || null;
      if (p === '4') return templateWithInfo.find(t => t.id === 'lrka_130') || null;
      if (p === '5') return templateWithInfo.find(t => t.id === 'lrka_131') || null;

      const dev126 = templateWithInfo.find(t => t.id === 'lrka_126');
      if (dev126) return dev126;
    }

    // Untuk pos selain belanja modal, cari di seluruh template tanpa dibatasi sumber dana
    const pool = templateWithInfo;
    const leafCandidates = pool.filter(c => c.isLeaf);
    
    // 1a. Cek matchKeys pada leaf
    let match = leafCandidates.find(c => c.matchKeys && c.matchKeys.includes(qClean));
    if (match) return match;

    // 1b. Cek exact match uraian leaf (setelah dibersihkan strip "- ")
    match = leafCandidates.find(c => {
      const cClean = c.uraian.toLowerCase().replace(/^[-•\s]+/, '').replace(/\s+/g, ' ');
      return cClean === qClean;
    });
    if (match) return match;

    // 1c. Cek normalisasi singkatan (tunj. -> tunjangan)
    const normalize = (s: string) => s.replace(/tunj\./g, 'tunjangan ').replace(/\s+/g, ' ').replace(/\.\s*/g, ' ').trim();
    const normQ = normalize(qClean);
    match = leafCandidates.find(c => {
      const normC = normalize(c.uraian.toLowerCase().replace(/^[-•\s]+/, ''));
      return normC === normQ;
    });
    if (match) return match;

    // 1d. Pemisahan khusus gaji 13 dan 14
    const isGaji13 = qClean.includes('gaji ke 13') || qClean.includes('ke-13');
    const isGaji14 = qClean.includes('gaji ke 14') || qClean.includes('ke-14');
    
    if (isGaji13 || isGaji14) {
      const filteredLeaf = leafCandidates.filter(c => {
        const cLower = c.uraian.toLowerCase();
        if (isGaji13) return cLower.includes('13');
        if (isGaji14) return cLower.includes('14');
        return false;
      });
      match = filteredLeaf.find(c => {
        const cClean = c.uraian.toLowerCase().replace(/^[-•\s]+/, '').replace(/\s+/g, ' ');
        const baseQ = qClean.replace(/\(gaji ke 1[34]\)/, '').trim();
        const baseC = cClean.replace(/\(gaji ke 1[34]\)/, '').trim();
        return normalize(baseC).includes(normalize(baseQ)) || normalize(baseQ).includes(normalize(baseC));
      });
      if (match) return match;
    } else {
      const nonGaji1314 = leafCandidates.filter(c => !c.uraian.includes('13') && !c.uraian.includes('14'));
      match = nonGaji1314.find(c => {
        const normC = normalize(c.uraian.toLowerCase().replace(/^[-•\s]+/, ''));
        return normC.includes(normQ) || normQ.includes(normC);
      });
      if (match) return match;
    }

    // Prioritas 2: Fallback ke seluruh pool (termasuk parent)
    match = pool.find(c => {
      const cClean = c.uraian.toLowerCase().replace(/^[-•\s]+/, '').replace(/\s+/g, ' ');
      return cClean === qClean;
    });
    if (match) return match;

    // Prioritas 3: Fallback ke global pool
    match = templateWithInfo.find(c => {
      const cClean = c.uraian.toLowerCase().replace(/^[-•\s]+/, '').replace(/\s+/g, ' ');
      return cClean === qClean;
    });
    if (match) return match;

    return null;
  };

  // 1. Petakan baris belanja langsung ke template berdasarkan klasifikasi
  (dataList || []).forEach(row => {
    const rawVal = getRowClassification 
      ? getRowClassification(row, 'RKA Kementrian') 
      : (row.tags?.['RKA Kementrian'] || row.tags?.['rka kementrian'] || row.laporan_kementerian || '');
    
    if (!rawVal || !String(rawVal).trim()) return;

    const match = findBestMatch(String(rawVal), row);

    if (match) {
      const entry = directMap.get(match.id)!;
      const pagu = Number(row.anggaran) || 0;
      entry.directPagu += pagu;
      entry.directCount += 1;
      entry.directRows.push(row);
    } else {
      unmappedRows.push(row);
    }
  });

  // 1.b. Petakan baris penyesuaian belanja ke template (prioritaskan anak leaf)
  (penyesuaianList || []).forEach(adj => {
    const factor = adj.jenis_penyesuaian === 'kurang' ? -1 : 1;
    const pagu = factor * (Number(adj.nilai_penyesuaian) || 0);
    if (!pagu) return;

    const rawUraian = String(adj.uraian || adj.nama_akun || '');
    const match = findBestMatch(rawUraian, adj);

    const adjRow = {
      id: `adj_${adj.id}`,
      unit: adj.unit_kerja,
      uraian_belanja: `[PENYESUAIAN ${adj.jenis_penyesuaian === 'kurang' ? '(-)' : '(+)'}] ${adj.uraian || adj.nama_akun}`,
      anggaran: pagu,
      sumber_dana_nama: 'Rupiah Murni (RM)',
      akun_detail: adj.nama_akun,
      is_penyesuaian: true,
      no_sk: adj.no_sk,
      tanggal_sk: adj.tanggal_sk,
      keterangan: adj.keterangan
    };

    if (match) {
      const entry = directMap.get(match.id)!;
      entry.directPagu += pagu;
      entry.directCount += 1;
      entry.directRows.push(adjRow);
    } else {
      unmappedRows.push(adjRow);
    }
  });

  const items = Array.from(directMap.values());

  // Inisialisasi totalPagu awal dengan directPagu
  items.forEach(it => {
    it.totalPagu = it.directPagu;
    it.totalCount = it.directCount;
    it.allRows = [...it.directRows];
  });

  // 2. Rollup ke atas (Hierarchical Bubble-up)
  // Setiap item yang memiliki data akan menambahkan nilai ke container/parent di atasnya
  for (let i = 0; i < items.length; i++) {
    const current = items[i];
    if (current.directCount === 0) continue;

    let currentLevel = current.level;
    for (let j = i - 1; j >= 0; j--) {
      const candidate = items[j];
      if (candidate.level < currentLevel) {
        candidate.totalPagu += current.directPagu;
        candidate.totalCount += current.directCount;
        candidate.allRows.push(...current.directRows);
        currentLevel = candidate.level;
        if (candidate.level === 0) break; // Berhenti di block level 0
      }
    }
  }

  // Grand Total adalah jumlah seluruh Blok Level 0
  const grandTotal = items.filter(it => it.level === 0).reduce((acc, it) => acc + it.totalPagu, 0);
  const grandCount = items.filter(it => it.level === 0).reduce((acc, it) => acc + it.totalCount, 0);

  return { items, unmappedRows, grandTotal, grandCount };
}
