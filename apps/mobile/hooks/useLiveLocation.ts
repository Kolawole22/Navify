import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  liveLocationService,
  CreateSessionData,
  LiveLocationSession,
} from "../services/liveLocationService";
import { useEffect, useRef } from "react";

// Query keys
export const liveLocationKeys = {
  all: ["liveLocation"] as const,
  sessions: () => [...liveLocationKeys.all, "sessions"] as const,
  session: (id: string) => [...liveLocationKeys.sessions(), id] as const,
  liveLocation: (sessionId: string, personalCode: string) =>
    [...liveLocationKeys.all, "live", sessionId, personalCode] as const,
};

// Get user's live location sessions
export function useLiveLocationSessions() {
  return useQuery({
    queryKey: liveLocationKeys.sessions(),
    queryFn: () => liveLocationService.getUserSessions(),
    staleTime: 30000, // 30 seconds
  });
}

// Create a new live location session
export function useCreateLiveLocationSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSessionData) =>
      liveLocationService.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveLocationKeys.sessions() });
    },
  });
}

// Stop a live location session
export function useStopLiveLocationSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      liveLocationService.stopSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveLocationKeys.sessions() });
    },
  });
}

// Add people to a session
export function useAddToSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      personalCodes,
    }: {
      sessionId: string;
      personalCodes: string[];
    }) => liveLocationService.addToSession(sessionId, personalCodes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveLocationKeys.sessions() });
    },
  });
}

// Remove someone from a session
export function useRemoveFromSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      personalCode,
    }: {
      sessionId: string;
      personalCode: string;
    }) => liveLocationService.removeFromSession(sessionId, personalCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: liveLocationKeys.sessions() });
    },
  });
}

// Get live location for viewing
export function useLiveLocation(
  sessionId: string,
  personalCode: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: liveLocationKeys.liveLocation(sessionId, personalCode),
    queryFn: () => liveLocationService.getLiveLocation(sessionId, personalCode),
    enabled: enabled && !!sessionId && !!personalCode,
    refetchInterval: 5000, // Refetch every 5 seconds
    staleTime: 0, // Always consider data stale
  });
}

// Hook for managing location tracking
export function useLocationTracking() {
  const isTracking = liveLocationService.isCurrentlyTracking();
  const currentSessionId = liveLocationService.getCurrentSessionId();

  const startTracking = async (sessionId: string) => {
    try {
      await liveLocationService.startLocationTracking(sessionId);
    } catch (error) {
      console.error("Error starting location tracking:", error);
      throw error;
    }
  };

  const stopTracking = async () => {
    try {
      await liveLocationService.stopLocationTracking();
    } catch (error) {
      console.error("Error stopping location tracking:", error);
      throw error;
    }
  };

  return {
    isTracking,
    currentSessionId,
    startTracking,
    stopTracking,
  };
}

// Hook for WebSocket connection and real-time updates
export function useLiveLocationWebSocket(
  sessionId: string,
  personalCode: string,
  onLocationUpdate?: (data: any) => void,
  onSessionStatus?: (data: any) => void
) {
  const socket = liveLocationService.getSocket();
  const onLocationUpdateRef = useRef(onLocationUpdate);
  const onSessionStatusRef = useRef(onSessionStatus);

  // Update refs when callbacks change
  useEffect(() => {
    onLocationUpdateRef.current = onLocationUpdate;
    onSessionStatusRef.current = onSessionStatus;
  }, [onLocationUpdate, onSessionStatus]);

  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (data: any) => {
      if (data.sessionId === sessionId) {
        onLocationUpdateRef.current?.(data);
      }
    };

    const handleSessionStatus = (data: any) => {
      if (data.sessionId === sessionId) {
        onSessionStatusRef.current?.(data);
      }
    };

    // Add event listeners
    socket.on("location_update", handleLocationUpdate);
    socket.on("session_status", handleSessionStatus);

    // Connect as viewer
    liveLocationService.connectAsViewer(sessionId, personalCode);

    // Cleanup
    return () => {
      socket.off("location_update", handleLocationUpdate);
      socket.off("session_status", handleSessionStatus);
    };
  }, [socket, sessionId, personalCode]);

  return {
    socket,
    isConnected: socket?.connected || false,
  };
}

// Hook for managing live location sharing (for sharers)
export function useLiveLocationSharing() {
  const queryClient = useQueryClient();
  const { isTracking, currentSessionId, startTracking, stopTracking } =
    useLocationTracking();

  const createSession = useCreateLiveLocationSession();
  const stopSession = useStopLiveLocationSession();
  const addToSession = useAddToSession();
  const removeFromSession = useRemoveFromSession();

  const startSharing = async (data: CreateSessionData) => {
    try {
      const session = await createSession.mutateAsync(data);
      await startTracking(session.id);
      return session;
    } catch (error) {
      console.error("Error starting sharing:", error);
      throw error;
    }
  };

  const stopSharing = async () => {
    try {
      if (currentSessionId) {
        await stopSession.mutateAsync(currentSessionId);
        await stopTracking();
      }
    } catch (error) {
      console.error("Error stopping sharing:", error);
      throw error;
    }
  };

  const addPeople = async (personalCodes: string[]) => {
    if (!currentSessionId) {
      throw new Error("No active session");
    }
    return addToSession.mutateAsync({
      sessionId: currentSessionId,
      personalCodes,
    });
  };

  const removePerson = async (personalCode: string) => {
    if (!currentSessionId) {
      throw new Error("No active session");
    }
    return removeFromSession.mutateAsync({
      sessionId: currentSessionId,
      personalCode,
    });
  };

  return {
    isTracking,
    currentSessionId,
    startSharing,
    stopSharing,
    addPeople,
    removePerson,
    isLoading: createSession.isPending || stopSession.isPending,
    error: createSession.error || stopSession.error,
  };
}
