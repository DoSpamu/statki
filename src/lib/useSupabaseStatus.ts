import { useEffect, useState } from 'react';
import { supabase } from './supabase';

type Status = 'checking' | 'online' | 'error';

interface SupabaseStatus {
  status: Status;
  gamesCount: number | null;
  errorMessage: string | null;
}

export function useSupabaseStatus(): SupabaseStatus {
  const [status, setStatus]           = useState<Status>('checking');
  const [gamesCount, setGamesCount]   = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkConnection() {
      // Odczyt liczby rekordów z tabeli games (head: true — tylko COUNT, bez danych)
      const { count, error } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true });

      if (error) {
        setStatus('error');
        setErrorMessage(error.message);
      } else {
        setStatus('online');
        setGamesCount(count ?? 0);
      }
    }

    checkConnection();
  }, []);

  return { status, gamesCount, errorMessage };
}
