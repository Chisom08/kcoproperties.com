export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "KCO Properties";

export const APP_LOGO =
  import.meta.env.VITE_APP_LOGO ||
  "/KCOLogo_color.png";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  // const appId = import.meta.env.VITE_APP_ID;
  // const redirectUri = `${window.location.origin}/api/oauth/callback`;
  // const state = btoa(redirectUri);

  // const url = new URL(`${oauthPortalUrl}/app-auth`);
  // url.searchParams.set("appId", appId);
  // url.searchParams.set("redirectUri", redirectUri);
  // url.searchParams.set("state", state);
  // url.searchParams.set("type", "signIn");

  // return url.toString();
  return 'https://portal.kcoproperties.com/login' 
};

// KCO Properties Brand Colors
export const BRAND_COLORS = {
  navy: '#0B2545',
  skyBlue: '#70C4ED',
} as const;

// Property types
export const PROPERTY_TYPES = [
  'Apartment',
  'House',
  'Condo',
  'Townhouse',
  'Studio',
] as const;

// Application statuses
export const APPLICATION_STATUSES = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  denied: 'Denied',
  incomplete: 'Incomplete',
} as const;

// Maintenance urgency levels
export const URGENCY_LEVELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  emergency: 'Emergency',
} as const;