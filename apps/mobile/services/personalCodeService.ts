// Personal code is now included in the user profile endpoint
// This service is kept for backward compatibility but will be removed
// Use the user profile service instead

export interface PersonalCodeData {
  personalCode: string | null;
  hasPersonalCode: boolean;
}

// This is now handled by the user profile service
// Personal codes are automatically generated on signup
// and included in the user profile response

// Helper function to extract personal code from profile data
export const extractPersonalCodeFromProfile = (
  profile: any
): PersonalCodeData => {
  return {
    personalCode: profile?.user?.personalCode || null,
    hasPersonalCode: !!profile?.user?.personalCode,
  };
};
