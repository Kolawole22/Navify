import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/store/authStore"; // Adjust path if needed
// import Toast from "react-native-toast-message";
import { triggerToast } from "./toastController";

// --- Configuration ---
// Replace with your actual backend URL
// Use localhost for simulators/emulators on the same machine
// Use your machine's network IP for physical devices
// process.env.EXPO_PUBLIC_API_BASE_URL ||
export const BASE_URL = "https://navify.onrender.com/api"; //"http://192.168.0.107:3006/api";
// export const BASE_URL = "http://192.168.0.111:3006/api";

// --- Create Axios Instance ---
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// --- Interceptors ---

// Request Interceptor: Add auth token to headers
axiosInstance.interceptors.request.use(
  async (config) => {
    // Get token directly from store state (outside React context)
    const token = useAuthStore.getState().token;
    // console.log("token", token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors like 401
axiosInstance.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        console.warn(
          "Axios Interceptor: Received 401 Unauthorized. Logging out."
        );
        // Use getState to access store outside of React components
        // Check if already logged out to prevent loops if logout itself fails
        if (useAuthStore.getState().isAuthenticated) {
          useAuthStore.getState().logout();
          // Optional: Trigger navigation to login screen
          // This is tricky from here, better handled by UI reacting to auth state change
          // Example: rootNavigation.navigate('Login');
        }
      }
      // You could handle other common errors here (e.g., 403 Forbidden, 500 Server Error)
    }

    // Important: return the error so components using the hook can handle it too
    return Promise.reject(error);
  }
);

export default axiosInstance;

export const handleError = (error: any) => {
  console.log("error", error.response.data.error);
  triggerToast({
    message:
      error.response.data.error ||
      error.response.data.message ||
      error.message ||
      "An error occurred",
    type: "error",
  });
};
