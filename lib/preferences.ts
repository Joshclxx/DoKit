export interface BusinessProfile {
  name: string;
  businessName: string;
  address: string;
  email: string;
}

export interface DoKitPreferences {
  businessProfile: BusinessProfile;
  currency: string;
}

export const currencies = [
  "USD",
  "EUR",
  "GBP",
  "PHP",
  "SGD",
  "JPY",
  "AUD",
  "CAD",
  "INR",
] as const;

export const defaultPreferences: DoKitPreferences = {
  businessProfile: {
    name: "",
    businessName: "",
    address: "",
    email: "",
  },
  currency: "USD",
};

export const RECENT_TOOLS_KEY = "dokit-recent-tools";
export const TOOL_STATE_PREFIX = "dokit-tool-";
