import { useEffect, useState } from 'react';

export function useAttendance(fetcher) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    fetcher()
      .then((res) => { if (alive) setData(res.data?.data ?? res.data); })
      .catch((err) => {
        if (alive) setError(err?.response?.data?.message || err?.message || 'Gagal memuat data kehadiran');
      });
    return () => { alive = false; };
  }, [fetcher, reloadKey]);

  const retry = () => { setError(null); setData(null); setReloadKey((k) => k + 1); };

  return { data, error, retry };
}