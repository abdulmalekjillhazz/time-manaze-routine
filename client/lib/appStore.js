import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useAppStore = create(persist(
  (set) => ({
    theme: 'dark',
    language: null,
    alarms: [],
    alarmSoundId: 'birds',
    stopwatchElapsedMs: 0,
    stopwatchStartedAt: null,
    setTheme: (theme) => set({ theme }),
    setLanguage: (language) => set({ language }),
    setAlarmSoundId: (alarmSoundId) => set({ alarmSoundId }),
    addAlarm: (alarm) => set((state) => ({ alarms: [...state.alarms, alarm] })),
    removeAlarm: (id) => set((state) => ({ alarms: state.alarms.filter((alarm) => alarm.id !== id) })),
    snoozeAlarm: (id, at) => set((state) => ({
      alarms: state.alarms.map((alarm) => alarm.id === id ? { ...alarm, at, firedAt: null } : alarm),
    })),
    markAlarmFired: (id) => set((state) => ({
      alarms: state.alarms.map((alarm) => alarm.id === id ? { ...alarm, firedAt: Date.now() } : alarm),
    })),
    startStopwatch: (now = Date.now()) => set((state) => (
      state.stopwatchStartedAt === null ? { stopwatchStartedAt: now } : state
    )),
    stopStopwatch: (now = Date.now()) => set((state) => ({
      stopwatchElapsedMs: state.stopwatchElapsedMs + (state.stopwatchStartedAt === null ? 0 : Math.max(0, now - state.stopwatchStartedAt)),
      stopwatchStartedAt: null,
    })),
    resetStopwatch: () => set({ stopwatchElapsedMs: 0, stopwatchStartedAt: null }),
  }),
  {
    name: 'smart-routine-ui',
    storage: createJSONStorage(() => (typeof globalThis.window === 'undefined' ? undefined : globalThis.window.localStorage)),
    skipHydration: true,
    partialize: (state) => ({
      theme: state.theme,
      language: state.language,
      alarms: state.alarms,
      alarmSoundId: state.alarmSoundId,
      stopwatchElapsedMs: state.stopwatchElapsedMs,
      stopwatchStartedAt: state.stopwatchStartedAt,
    }),
  }
));
