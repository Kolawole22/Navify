import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axiosInstance, { handleError } from "@/lib/axiosInstance"; // Adjust path if needed
import { useAuthStore } from "@/store/authStore";
// import { toast } from "react-toastify";
import { useToast } from "@/components/ToastProvider";

// Define the shape of an Address object based on backend/schema
export interface Address {
  // Export interface

  areaCode: string;
  areaType: string;
  category: string;
  city: string;
  createdAt: string;
  estate: string;
  floor: number;
  hhgCode: string;
  houseNumber: string;
  id: number;
  isSaved: boolean;
  isBookmarked?: boolean; // Add bookmark status
  label: string;
  landmark: string;
  latitude: string;
  lgaCode: string;
  locationNumber: string;
  longitude: string;
  photoUrls: Array<string>;
  qrCodeImageUrl?: string; // URL to the generated QR code image
  specialDescription: string;
  stateCode: string;
  street: string;
  updatedAt: string;
  userId: string;
}

// ... existing types (User, AuthResponse, Payloads) ...

// Payload for creating a new address (similar to RegisterPayload's address part)
interface CreateAddressPayload {
  latitude: number;
  longitude: number;
  street: string;
  stateCode: string; // Fixed: was "state"
  lgaCode: string; // Fixed: was "lga"
  city: string;
  houseNumber?: string;
  landmark?: string;
  floor?: string; // Fixed: was "apartment"
  estate?: string;
  specialDescription?: string;
  photoUrls?: string[];
  isSaved?: boolean;
  label?: string;
  category?: string; // Added missing category field
}

// --- API Call Functions ---

// ... existing API functions (requestOtpApi, verifyOtpApi, etc.) ...

const fetchSavedAddressesApi = async (): Promise<Address[]> => {
  // Token attached by interceptor
  const { data } = await axiosInstance.get<Address[]>("/addresses");
  return data;
};

const fetchAddressByIdApi = async (id: string): Promise<Address> => {
  // Token attached by interceptor
  const { data } = await axiosInstance.get<Address>(`/addresses/${id}`);
  return data;
};

const createAddressApi = async (
  payload: CreateAddressPayload
): Promise<Address> => {
  // Backend expects latitude and longitude as numbers
  const backendPayload = {
    ...payload,
    // latitude and longitude are already numbers, no conversion needed
  };

  // Assuming the backend returns the newly created Address object
  const { data } = await axiosInstance.post<Address>(
    "/addresses",
    backendPayload
  );
  return data;
};

// --- Bookmarks API ---
export const bookmarkAddressApi = async (addressId: number): Promise<void> => {
  await axiosInstance.post(`/addresses/${addressId}/bookmark`);
};

export const unbookmarkAddressApi = async (
  addressId: number
): Promise<void> => {
  await axiosInstance.delete(`/addresses/${addressId}/bookmark`);
};

export const fetchBookmarksApi = async (): Promise<Address[]> => {
  const { data } = await axiosInstance.get<{ bookmarks: Address[] }>(
    "/users/me/bookmarks"
  );
  return data.bookmarks;
};

// --- TanStack Query Hooks ---

// ... existing hooks (useRequestOtp, useVerifyOtp, etc.) ...

// Hook to fetch saved addresses for the current user
export const useSavedAddresses = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<Address[], Error>({
    queryKey: ["savedAddresses"], // Unique key for this query
    queryFn: fetchSavedAddressesApi,
    enabled: !!isAuthenticated, // Only run query if user is authenticated
    staleTime: 1000 * 60 * 2, // Cache data for 2 minutes
  });
};

// Hook to fetch a single address by ID
export const useAddressById = (id: string | undefined) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery<Address, Error>({
    queryKey: ["address", id], // Unique key for this query
    queryFn: () => fetchAddressByIdApi(id!),
    enabled: !!isAuthenticated && !!id, // Only run query if user is authenticated and ID exists
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation<Address, Error, CreateAddressPayload>({
    mutationFn: createAddressApi,
    onSuccess: (newAddress) => {
      // When a new address is created, invalidate the saved addresses query
      // to refetch the list including the new one.
      queryClient.invalidateQueries({ queryKey: ["savedAddresses"] });

      // Optional: Update the cache directly for faster UI update
      queryClient.setQueryData<Address[]>(["savedAddresses"], (oldData) => {
        return oldData ? [...oldData, newAddress] : [newAddress];
      });
    },
    // Optional: onError handler
  });
};

export const useBookmarkAddress = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation<void, Error, number>({
    mutationFn: bookmarkAddressApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      showToast({
        message: "Address added to your bookmarks",
        type: "success",
      });
    },
    onError: handleError,
  });
};

export const useUnbookmarkAddress = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: unbookmarkAddressApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
    onError: handleError,
  });
};

export const useBookmarks = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery<Address[], Error>({
    queryKey: ["bookmarks"],
    queryFn: fetchBookmarksApi,
    enabled: !!isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });
};

// TODO: Add hooks for createAddress, updateAddress, deleteAddress later
