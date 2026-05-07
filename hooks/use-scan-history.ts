/**
 * Salvatore — Scan history persisted with AsyncStorage
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@salvatore_scan_history';
const MAX_ENTRIES = 10;

export interface ScanEntry {
  url: string;
  score: number;
  verdict: 'safe' | 'caution' | 'danger';
  timestamp: number;
}

export function useScanHistory() {
  const [history, setHistory] = useState<ScanEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setHistory(JSON.parse(raw));
      } catch {
        // ignore read errors
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const addEntry = useCallback(
    async (entry: Omit<ScanEntry, 'timestamp'>) => {
      const newEntry: ScanEntry = { ...entry, timestamp: Date.now() };
      const updated = [newEntry, ...history.filter((e) => e.url !== entry.url)].slice(
        0,
        MAX_ENTRIES
      );
      setHistory(updated);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore write errors
      }
    },
    [history]
  );

  const clearHistory = useCallback(async () => {
    setHistory([]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { history, loaded, addEntry, clearHistory };
}
