'use client';

import { useSyncExternalStore } from 'react';

const NICKNAME_KEY = 'r10tri_apelido';
const NICKNAME_EVENT = 'r10tri:apelido';

function readNickname(): string {
  try { return window.localStorage.getItem(NICKNAME_KEY) ?? ''; } catch { return ''; }
}

function subscribeNickname(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === NICKNAME_KEY || event.key === null) listener();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(NICKNAME_EVENT, listener);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(NICKNAME_EVENT, listener);
  };
}

export function useStoredNickname(): string {
  return useSyncExternalStore(subscribeNickname, readNickname, () => '');
}

export function saveNickname(value: string): void {
  try { window.localStorage.setItem(NICKNAME_KEY, value); } catch { return; }
  window.dispatchEvent(new Event(NICKNAME_EVENT));
}

let currentTime: number | null = null;
const clockListeners = new Set<() => void>();
let clockInterval: ReturnType<typeof setInterval> | undefined;

function updateClock() {
  currentTime = Date.now();
  clockListeners.forEach((listener) => listener());
}

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockListeners.size === 1) {
    updateClock();
    clockInterval = setInterval(updateClock, 60_000);
    document.addEventListener('visibilitychange', updateClock);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0) {
      clearInterval(clockInterval);
      document.removeEventListener('visibilitychange', updateClock);
    }
  };
}

export function useCurrentTime(): number | null {
  return useSyncExternalStore(subscribeClock, () => currentTime, () => null);
}

export function useLocalDate(): string {
  const now = useCurrentTime();
  if (now === null) return '';
  const date = new Date(now);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
