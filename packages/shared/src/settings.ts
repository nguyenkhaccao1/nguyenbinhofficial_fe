/** Kieu cau hinh website — khop voi Application/Settings/SettingGroups.cs. */

export interface MediaRef {
  id: string;
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface BrandSettings {
  siteName: string;
  shortName: string;
  legalName: string | null;
  tagline: string | null;
  description: string | null;
  logo: MediaRef | null;
  logoDark: MediaRef | null;
  favicon: MediaRef | null;
}

export interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  darkColor: string;
}

export interface ContactSettings {
  phone: string | null;
  hotline: string | null;
  email: string | null;
  address: string | null;
  mapUrl: string | null;
  zaloPhone: string | null;
  zaloUrl: string | null;
  messengerUrl: string | null;
  workingHours: string | null;
  taxCode: string | null;
}

export interface SocialSettings {
  facebook: string | null;
  linkedIn: string | null;
  youTube: string | null;
  tikTok: string | null;
  gitHub: string | null;
  x: string | null;
}

export interface TrackingSettings {
  ga4MeasurementId: string | null;
  gtmContainerId: string | null;
  googleSiteVerification: string | null;
  bingSiteVerification: string | null;
  metaPixelId: string | null;
  clarityProjectId: string | null;
}

export interface SeoSettings {
  siteUrl: string;
  titleTemplate: string;
  defaultTitle: string | null;
  defaultDescription: string | null;
  defaultOgImage: MediaRef | null;
  twitterHandle: string | null;
  robotsExtra: string | null;
}

export interface FormSettings {
  notificationEmails: string[];
  sendAutoReply: boolean;
}

/** Cac nhom tra ve tu GET /api/v1/site/settings. */
export interface PublicSettings {
  brand: BrandSettings;
  theme: ThemeSettings;
  contact: ContactSettings;
  social: SocialSettings;
  tracking: TrackingSettings;
  seo: SeoSettings;
}

export interface AllSettings extends PublicSettings {
  forms: FormSettings;
}

export type SettingGroupKey = keyof AllSettings;
