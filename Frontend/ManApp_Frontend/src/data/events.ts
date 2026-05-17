export interface EventDataItem {
  id: string;
  name: string;
  location: string;
  date: string;
  pic: string;
}

export const EVENT_DATA: EventDataItem[] = [
  { id: 'm1', name: 'Webinar Ketua Osis se-Sulawesi', location: 'Dian Auditorium UC Makassar', date: '2026-06-02', pic: 'Dylon' },
  { id: 'm2', name: 'Event Basket MA ARIFAH Gowa', location: 'Lapangan Basket UC Makassar', date: '2026-06-01', pic: 'Fathir' },
  { id: 'm3', name: 'Mayora Goes to Campus', location: 'Classroom A606', date: '2026-06-15', pic: 'Fathir' },
  { id: 'm4', name: 'Natal SD Katolik St. Joseph Rajawali', location: 'Lapangan Basket UC Makassar', date: '2026-07-01', pic: 'Dylon' },
  { id: 'm5', name: 'Wisuda Santri TK/TPA Barokah', location: 'Dian Auditorium UC Makassar Lt7', date: '2026-05-05', pic: 'Fathir' },
  { id: 'm6', name: 'Pameran Buku by Gramedia', location: 'Lapangan Basket UC Makassar', date: '2026-05-10', pic: 'Dylon' },
];

export const normalizeName = (value: string | undefined | null) =>
  (value || '').trim().toLowerCase();
