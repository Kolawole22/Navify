import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axiosInstance";
import { AxiosResponse } from "axios";

export interface State {
  name: string;
  code: string;
}

export interface Lga {
  name: string;
  code: string;
}

export interface AddressCategory {
  id: string;
  label: string;
  description: string;
}

// Re-export the Address type from its source
export type { Address } from "@/services/addressService";
import type { Address as AddressType } from "@/services/addressService"; // Import for internal use

interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data?: T;
  message?: string;
}

interface UseLocationsResult {
  states?: State[];
  lgas?: Lga[];
  addressCategories?: AddressCategory[];
  isLoadingStates: boolean;
  isLoadingLgas: boolean;
  isLoadingAddressCategories: boolean;
  isErrorStates: boolean;
  isErrorLgas: boolean;
  isErrorAddressCategories: boolean;
  errorStates: Error | null;
  errorLgas: Error | null;
  errorAddressCategories: Error | null;
}

const fetchStates = async (): Promise<State[]> => {
  const response: AxiosResponse<ApiResponse<State[]>> = await axiosInstance.get(
    "/locations/states"
  );
  if (!response.data?.success || !response.data?.data) {
    throw new Error(response.data?.message || "Failed to fetch states");
  }
  return response.data.data;
};

const fetchLgasByState = async (stateCode: string): Promise<Lga[]> => {
  const response: AxiosResponse<ApiResponse<Lga[]>> = await axiosInstance.get(
    `/locations/states/${stateCode}/lgas`
  );
  if (!response.data?.success || !response.data?.data) {
    throw new Error(
      response.data?.message || `Failed to fetch LGAs for state ${stateCode}`
    );
  }
  return response.data.data;
};

const fetchCategories = async () => {
  const response = await axiosInstance.get("/address/categories");

  console.log("Categories", response);
  return response.data as AddressCategory[];
};

/**
 * Hook to fetch Nigerian states and LGAs for a selected state using TanStack Query.
 * @param selectedStateCode - The code of the selected state (e.g., 'LA'). LGAs are fetched only if this is provided.
 * @returns An object containing states, LGAs, loading status, and errors.
 */
export const useLocations = (
  selectedStateCode?: string
): UseLocationsResult => {
  // Query for States
  const {
    data: statesData,
    isLoading: isLoadingStates,
    isError: isErrorStates,
    error: errorStates,
  } = useQuery<State[], Error>({
    queryKey: ["states"],
    queryFn: fetchStates,
    staleTime: 1000 * 60 * 60,
  });

  // Dependent Query for LGAs
  const {
    data: lgasData,
    isLoading: isLoadingLgas,
    isError: isErrorLgas,
    error: errorLgas,
  } = useQuery<Lga[], Error>({
    queryKey: ["lgas", selectedStateCode],
    queryFn: () => fetchLgasByState(selectedStateCode!),
    enabled: !!selectedStateCode,
    staleTime: 1000 * 60 * 5,
  });

  // Query for Address Categories
  const {
    data: addressCategoriesData,
    isLoading: isLoadingAddressCategories,
    isError: isErrorAddressCategories,
    error: errorAddressCategories,
  } = useQuery<AddressCategory[], Error>({
    queryKey: ["addressCategories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    states: statesData,
    lgas: lgasData,
    addressCategories: addressCategoriesData,
    isLoadingStates,
    isLoadingLgas,
    isLoadingAddressCategories,
    isErrorStates,
    isErrorLgas,
    isErrorAddressCategories,
    errorStates: errorStates instanceof Error ? errorStates : null,
    errorLgas: errorLgas instanceof Error ? errorLgas : null,
    errorAddressCategories:
      errorAddressCategories instanceof Error ? errorAddressCategories : null,
  };
};

/**
 * Hook to search addresses based on a query string.
 * @param query - The search term.
 * @returns TanStack Query result for address search.
 */
export const useAddressSearch = (query: string) => {
  const searchAddressesApi = async (query: string): Promise<AddressType[]> => {
    if (!query || query.trim().length < 1) return [];
    const { data } = await axiosInstance.get<AddressType[]>(
      `/addresses/search?q=${encodeURIComponent(query.trim())}`
    );
    return data;
  };

  return useQuery<AddressType[], Error>({
    queryKey: ["addressSearch", query],
    queryFn: () => searchAddressesApi(query),
    enabled: !!query && query.trim().length >= 2,
    staleTime: 1000 * 60 * 1,
    placeholderData: [],
  });
};

export const useAddressCategories = () => {
  const fetchCategoriesApi = async (): Promise<AddressCategory[]> => {
    const { data } = await axiosInstance.get<AddressCategory[]>(
      "/address/categories"
    );
    return data;
  };

  return useQuery<AddressCategory[], Error>({
    queryKey: ["addressCategories"],
    queryFn: fetchCategoriesApi,
    staleTime: 1000 * 60 * 60, // 1 hour
    placeholderData: [],
  });
};
