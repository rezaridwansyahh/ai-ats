export const routeMap = {
  'People Hub': {
    'Beranda':       '/',
    'Karyawan':      '/karyawan',
    'Dashboard':     '/dashboard',
    'Pengingat':     '/pengingat',
    'Impor Excel':   '/impor',
    'Scan dokumen':  '/scan',
    'Pengaturan':    '/pengaturan',
    'Kredit AI':     '/kredit',
  },
  'Attendance Intelligence': {
    'Beranda':             '/attendance/beranda',
    'Dashboard':           '/attendance/dashboard',
    'Rekap karyawan':      '/attendance/rekap',
    'Cuti & saldo':        '/attendance/cuti',
    'Impor mesin absensi': '/attendance/impor',
    'Absen klik (PWA)':    '/attendance/absen',
    'Pengaturan':          '/attendance/pengaturan',
  },
};

const detailMap = {
  '/karyawan': 'Profil 360',
  '/attendance/rekap': 'Detail kehadiran',
};

export const getRoute = (moduleName, menuName) =>
  routeMap[moduleName]?.[menuName] ?? `/${menuName.toLowerCase().replace(/\s+/g, '-')}`;

export function findPage(pathname) {
  let best = null;
  for (const [moduleName, menus] of Object.entries(routeMap)) {
    for (const [menuName, route] of Object.entries(menus)) {
      const match = pathname === route || pathname.startsWith(route + '/');
      if (match && (!best || route.length > best.route.length)) best = { moduleName, menuName, route };
    }
  }
  if (!best) return { module: 'People Hub', title: 'Tidak ditemukan' };
  const title = pathname !== best.route && detailMap[best.route] ? detailMap[best.route] : best.menuName;
  return { module: best.moduleName, title };
}