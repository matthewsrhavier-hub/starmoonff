export type SelectedProfile = {
  id: string | number;
  name: string;
  avatar_url?: string | null;
  is_kids?: boolean;
};

export const SELECTED_PROFILE_KEY = 'fzone_selected_profile';

export function getSelectedProfile(): SelectedProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SELECTED_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id) return null;
    return parsed as SelectedProfile;
  } catch {
    return null;
  }
}

export function getSelectedProfileId(): string {
  const profile = getSelectedProfile();
  return profile?.id != null ? String(profile.id) : 'default';
}

export function setSelectedProfile(profile: SelectedProfile) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SELECTED_PROFILE_KEY, JSON.stringify(profile));
}
