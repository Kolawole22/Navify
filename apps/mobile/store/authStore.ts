import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
// Import SecureStore
import * as SecureStore from "expo-secure-store";

// Define the shape of the user object (adjust as needed)
interface User {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  // Add other relevant user fields
}

// Define the state structure
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // To track login/logout process
  error: string | null; // To store any auth errors
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => void; // Example login action
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// --- Custom Secure Storage Adapter ---
const secureStorageAdapter: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error(`Failed to get item "${name}" from SecureStore`, error);
      return null; // Return null or handle appropriately
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error(`Failed to set item "${name}" in SecureStore`, error);
      // Handle error if needed (e.g., notify user, retry logic)
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error(`Failed to remove item "${name}" from SecureStore`, error);
      // Handle error if needed
    }
  },
};
// --- End Custom Adapter ---

// Create the store using Zustand
export const useAuthStore = create<AuthState>()(
  // Use persist middleware to save state to SecureStore
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false, // Start as not loading
      error: null,

      // --- Actions ---

      // Directly set the user object
      setUser: (user) => set({ user }),

      // Directly set the token and update isAuthenticated
      setToken: (token) => set({ token, isAuthenticated: !!token }),

      // Example Login Action: Updates user, token, and auth status
      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        // In a real app, you might trigger side effects here,
        // like navigating the user or fetching additional data.
      },

      // Logout Action: Clears user, token, and resets state
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        // Clear any other related data if needed
        // AsyncStorage.removeItem('some_other_key'); // Example
      },

      // Set loading state (e.g., during API calls)
      setLoading: (loading) => set({ isLoading: loading }),

      // Set error state
      setError: (error) => set({ error }),
    }),
    {
      // Configuration for persistence
      name: "auth-secure-storage", // Unique name for the storage key
      storage: createJSONStorage(() => secureStorageAdapter), // Use SecureStore
      // Selectively persist only necessary parts of the state
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Optional: Selector hooks for convenience
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthToken = () => useAuthStore((state) => state.token);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
