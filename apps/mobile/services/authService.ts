import { useAuthStore } from "@/store/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axiosInstance";

// User type from the backend (excluding sensitive data)
// Match this with the type expected by useAuthStore's login action
interface User {
  id: string;
  name: string; // Combined name - make sure store expects this
  email: string;
  firstName?: string; // Keep for API response parsing if separate
  lastName?: string;
  phoneNumber?: string;
}

interface AuthResponse {
  user: User; // This User type might differ slightly from store's expectation
  token: string;
}

interface OtpRequestPayload {
  phoneNumber: string;
}

interface OtpVerifyPayload {
  phoneNumber: string;
  otp: string;
}

// Use backend User type + password
interface LoginPayload {
  email: string;
  password: string;
}

// Combine backend User, Address, and password
interface RegisterPayload {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  city: string;
  street: string;
  houseNumber?: string;
  landmark?: string;
  apartment?: string; // Maps to 'floor'
  estate?: string;
  specialDescription?: string;
  category?: string; // Add optional category
  photoUrls?: string[]; // Array of strings
  latitude: number;
  longitude: number;
}

// Type for the address object returned by the API (adjust based on schema)
// Ensure this includes latitude and longitude!
export interface Address {
  id: number;
  hhgCode: string;
  street: string;
  city: string;
  stateCode: string;
  lgaCode: string;
  latitude: string; // Comes as string from backend (numeric/decimal)
  longitude: string;
  houseNumber?: string;
  landmark?: string;
  estate?: string;
  floor?: string;
  specialDescription?: string;
  label?: string;
  isSaved?: boolean;
  userId?: string;
  // Add other fields as needed
}

// Types for enhanced profile
export interface UserProfile {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    fullName: string;
    preferences: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    totalAddresses: number;
    totalLocations: number;
    unreadNotifications: number;
  };
  recentAddresses: Array<{
    id: number;
    hhgCode: string;
    latitude: string;
    longitude: string;
    street: string | null;
    city: string | null;
    stateCode: string | null;
    lgaCode: string | null;
    areaType: string | null;
    areaCode: string | null;
    locationNumber: string | null;
    houseNumber: string | null;
    estate: string | null;
    floor: string | null;
    landmark: string | null;
    specialDescription: string | null;
    category: string | null;
    isSaved: boolean;
    label: string | null;
    createdAt: string;
  }>;
  recentLocations: Array<{
    id: string;
    latitude: string;
    longitude: string;
    activity: string | null;
    visitedAt: string;
    metadata: Record<string, any> | null;
  }>;
}

// --- API Call Functions (Implement these based on the hooks below) ---

const requestOtpApi = async (
  payload: OtpRequestPayload
): Promise<{ message: string }> => {
  const { data } = await axiosInstance.post("/auth/request-otp", payload);
  return data;
};

const verifyOtpApi = async (
  payload: OtpVerifyPayload
): Promise<{ message: string }> => {
  const { data } = await axiosInstance.post("/auth/verify-otp", payload);
  return data;
};

const registerApi = async (payload: RegisterPayload): Promise<AuthResponse> => {
  // Send latitude and longitude as numbers (Zod schema expects numbers)
  const { data } = await axiosInstance.post<AuthResponse>(
    "/auth/register",
    payload
  );
  return data;
};

const loginApi = async (payload: LoginPayload): Promise<AuthResponse> => {
  console.log("payload", payload);

  const { data } = await axiosInstance.post<AuthResponse>(
    "/auth/login",
    payload
  );

  return data;
};

const fetchCurrentUserApi = async (): Promise<{ user: User }> => {
  // Only call if authenticated (token should be attached by interceptor)
  const { data } = await axiosInstance.get<{ user: User }>("/auth/me");
  return data;
};

// Update current user profile
interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

const updateProfileApi = async (
  payload: UpdateProfilePayload
): Promise<User> => {
  const { data } = await axiosInstance.patch<User>("/users/me", payload);
  return data;
};

// User Preferences
export interface UserPreferences {
  darkMode?: boolean;
  notifications?: boolean;
  language?: string;
  units?: string;
}

const getPreferencesApi = async (): Promise<{
  preferences: UserPreferences;
}> => {
  const { data } = await axiosInstance.get<{ preferences: UserPreferences }>(
    "/users/me/preferences"
  );
  return data;
};

const updatePreferencesApi = async (
  prefs: UserPreferences
): Promise<{ preferences: UserPreferences }> => {
  const { data } = await axiosInstance.patch<{ preferences: UserPreferences }>(
    "/users/me/preferences",
    prefs
  );
  return data;
};

const fetchUserProfileApi = async (): Promise<UserProfile> => {
  const { data } = await axiosInstance.get<UserProfile>("/users/me/profile");
  return data;
};

// --- TanStack Query Hooks ---

export const useRequestOtp = () => {
  return useMutation<
    {
      message: string;
    },
    Error,
    OtpRequestPayload
  >({
    mutationFn: requestOtpApi,
    // Optional: onSuccess, onError handlers
  });
};

export const useVerifyOtp = () => {
  return useMutation<
    {
      message: string;
    },
    Error,
    OtpVerifyPayload
  >({
    mutationFn: verifyOtpApi,
  });
};

export const useRegister = () => {
  const loginAction = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  // Explicitly type the mutation hook arguments: TData, TError, TVariables
  return useMutation<AuthResponse, Error, RegisterPayload>({
    mutationFn: registerApi,
    onSuccess: (data) => {
      // Construct the User object expected by the store
      // Ensure the 'User' type here matches the one in the store
      const storeUser: User = {
        id: data.user.id,
        name: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim(),
        email: data.user.email,
        // Add other properties expected by the store's User type if needed
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        phoneNumber: data.user.phoneNumber,
      };
      loginAction(storeUser, data.token);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    // Optional: onError handler
  });
};

export const useLogin = () => {
  const loginAction = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  // Explicitly type the mutation hook arguments
  return useMutation<AuthResponse, Error, LoginPayload>({
    mutationFn: loginApi,
    onSuccess: (data) => {
      // Construct the User object expected by the store
      const storeUser: User = {
        id: data.user.id,
        name: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim(),
        email: data.user.email,
        // Add other properties expected by the store's User type if needed
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        phoneNumber: data.user.phoneNumber,
      };
      loginAction(storeUser, data.token);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
    // Optional: onError handler
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation<User, Error, UpdateProfilePayload>({
    mutationFn: updateProfileApi,
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
};

// Hook to fetch the current user, enabled only when authenticated
export const useCurrentUser = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Explicitly type the query hook arguments
  return useQuery<
    {
      user: User;
    },
    Error,
    User,
    readonly ["currentUser"]
  >({
    queryKey: ["currentUser"], // Unique key for this query
    queryFn: fetchCurrentUserApi,
    enabled: !!isAuthenticated, // Only run query if user is authenticated
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    select: (data) => data.user, // Directly return the user object
  });
};

export const usePreferences = () => {
  return useQuery<{ preferences: UserPreferences }, Error>({
    queryKey: ["preferences"],
    queryFn: getPreferencesApi,
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  return useMutation<{ preferences: UserPreferences }, Error, UserPreferences>({
    mutationFn: updatePreferencesApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
    },
  });
};

export const useUserProfile = () => {
  return useQuery<UserProfile, Error>({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfileApi,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
