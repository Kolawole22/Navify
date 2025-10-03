import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

// Define the shape of preferences
interface PreferencesState {
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: () => void;
  resetPreferences: () => void;
}

// Storage adapter using SecureStore
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      // Default state - onboarding not completed
      hasCompletedOnboarding: false,

      // Mark onboarding as complete
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

      // Reset all preferences (useful for testing or "nuke" option)
      resetPreferences: () => set({ hasCompletedOnboarding: false }),
    }),
    {
      name: "app-preferences",
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
