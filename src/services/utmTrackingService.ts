import { SignupSource } from '../lib/database.types';

export const UTM_STORAGE_KEY = 'speechai_utm';

export interface RawUtmSourceData {
  has_utm: boolean;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  referrer?: string | null;
  landing_page: string;
  captured_at: string;
  fallback_type?: 'organic' | 'direct';
}

const SEARCH_ENGINE_HOSTS = [
  'google.',
  'bing.com',
  'yahoo.com',
  'duckduckgo.com',
  'ecosia.org',
  'baidu.com',
  'yandex.'
];

const KNOWN_PARTNER_KEYWORDS = [
  'ihk',
  'partner',
  'goethe',
  'affiliate',
  'b2b',
  'terratern',
  'ausbildung_partner'
];

/**
 * Capture script: Runs on every page load site-wide.
 * 
 * Rules:
 * 1. If UTM params are present in the URL, ALWAYS overwrite localStorage
 *    (most recent intentional campaign click wins).
 * 2. If NO UTM params are present:
 *    - If localStorage ALREADY has a stored value, DO NOT overwrite.
 *    - If localStorage is empty, determine source from document.referrer
 *      (search engine -> organic, empty -> direct, other external -> organic)
 *      and store it.
 */
export function initUtmCapture(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');
    const utmContent = searchParams.get('utm_content');
    const utmTerm = searchParams.get('utm_term');

    const hasUtmInUrl = !!(utmSource || utmMedium || utmCampaign);

    if (hasUtmInUrl) {
      // Intentional campaign click: Always overwrite
      const payload: RawUtmSourceData = {
        has_utm: true,
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
        utm_content: utmContent || null,
        utm_term: utmTerm || null,
        referrer: document.referrer || null,
        landing_page: window.location.pathname + window.location.search,
        captured_at: new Date().toISOString(),
      };

      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(payload));
      return;
    }

    // No UTM in current URL: Only record non-UTM source if NOTHING is stored yet
    const existingRaw = localStorage.getItem(UTM_STORAGE_KEY);
    if (!existingRaw) {
      const rawReferrer = document.referrer ? document.referrer.trim() : '';

      let fallbackType: 'organic' | 'direct' = 'direct';

      if (rawReferrer) {
        try {
          const refUrl = new URL(rawReferrer);
          const refHost = refUrl.hostname.toLowerCase();

          // Don't count internal navigation as organic referrer
          if (refHost !== window.location.hostname.toLowerCase()) {
            fallbackType = SEARCH_ENGINE_HOSTS.some((se) => refHost.includes(se)) ? 'organic' : 'organic';
          }
        } catch {
          fallbackType = 'organic';
        }
      }

      const payload: RawUtmSourceData = {
        has_utm: false,
        referrer: rawReferrer || null,
        landing_page: window.location.pathname + window.location.search,
        captured_at: new Date().toISOString(),
        fallback_type: fallbackType,
      };

      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch (err) {
    // Non-blocking catch for restricted iframes / private browsing modes
    console.warn('[UTM] Error during UTM capture:', err);
  }
}

/**
 * Maps raw captured UTM parameters to the strict signup_source enum.
 */
export function mapUtmToSignupSource(
  data: RawUtmSourceData | null
): { source: SignupSource; source_detail: Record<string, any> | null } {
  // Edge case: No data stored (e.g. direct visit with blocked localStorage)
  if (!data) {
    return {
      source: 'direct',
      source_detail: null,
    };
  }

  // 1. If not a UTM campaign visit, map based on fallback type
  if (!data.has_utm) {
    const source: SignupSource = data.fallback_type === 'organic' ? 'organic' : 'direct';
    return {
      source,
      source_detail: {
        captured_via: data.fallback_type,
        referrer: data.referrer || null,
        landing_page: data.landing_page,
        captured_at: data.captured_at,
      },
    };
  }

  // 2. UTM campaign visit
  const rawSource = (data.utm_source || '').toLowerCase().trim();
  const rawMedium = (data.utm_medium || '').toLowerCase().trim();

  const sourceDetail: Record<string, any> = {
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
    utm_content: data.utm_content || null,
    utm_term: data.utm_term || null,
    referrer: data.referrer || null,
    landing_page: data.landing_page,
    captured_at: data.captured_at,
  };

  // Rule A: Partner override (if source contains partner keywords)
  if (KNOWN_PARTNER_KEYWORDS.some((kw) => rawSource.includes(kw))) {
    return { source: 'partner', source_detail: sourceDetail };
  }

  // Rule B: Medium-based mapping
  // 'paid_social', 'social' -> paid_social
  if (
    rawMedium === 'paid_social' ||
    rawMedium === 'paidsocial' ||
    rawMedium === 'social' ||
    rawMedium === 'social_ad' ||
    rawMedium === 'fb_ad' ||
    rawMedium === 'ig_ad'
  ) {
    return { source: 'paid_social', source_detail: sourceDetail };
  }

  // 'cpc', 'ppc', 'paid_search', 'search' -> paid_search
  if (
    rawMedium === 'cpc' ||
    rawMedium === 'ppc' ||
    rawMedium === 'paid_search' ||
    rawMedium === 'search' ||
    rawMedium === 'adwords'
  ) {
    return { source: 'paid_search', source_detail: sourceDetail };
  }

  // 'referral', 'email', 'newsletter', 'affiliate' -> referral
  if (
    rawMedium === 'referral' ||
    rawMedium === 'email' ||
    rawMedium === 'newsletter' ||
    rawMedium === 'link' ||
    rawMedium === 'pr'
  ) {
    return { source: 'referral', source_detail: sourceDetail };
  }

  // 'organic', 'seo' -> organic
  if (rawMedium === 'organic' || rawMedium === 'seo') {
    return { source: 'organic', source_detail: sourceDetail };
  }

  // Check if source alone clearly indicates paid_social or search
  if (['instagram', 'facebook', 'linkedin', 'tiktok', 'twitter', 'x'].some((s) => rawSource.includes(s))) {
    return { source: 'paid_social', source_detail: sourceDetail };
  }

  if (['google', 'bing'].some((s) => rawSource.includes(s)) && rawMedium.includes('ad')) {
    return { source: 'paid_search', source_detail: sourceDetail };
  }

  // Default fallback for unrecognized campaign medium
  return { source: 'other', source_detail: sourceDetail };
}

/**
 * Reads stored UTM data, maps it to { source, source_detail }, ready for profiles table insertion.
 */
export function getAndMapStoredUtmSource(): {
  source: SignupSource;
  source_detail: Record<string, any> | null;
} {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { source: 'direct', source_detail: null };
  }

  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) {
      return { source: 'direct', source_detail: null };
    }

    const parsed: RawUtmSourceData = JSON.parse(raw);
    return mapUtmToSignupSource(parsed);
  } catch (err) {
    console.warn('[UTM] Error reading stored UTM source:', err);
    return { source: 'direct', source_detail: null };
  }
}

/**
 * Clears the stored UTM source key after successful signup.
 */
export function clearStoredUtmSource(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    localStorage.removeItem(UTM_STORAGE_KEY);
  } catch (err) {
    console.warn('[UTM] Error clearing stored UTM key:', err);
  }
}
