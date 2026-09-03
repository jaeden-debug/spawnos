/**
 * SpawnOS iOS — the single source of truth for App Store facts.
 *
 * Website copy, metadata, JSON-LD, CTAs and the Blackwater integration all read
 * from here so they cannot silently contradict each other or the live listing.
 *
 * Every value below was verified against Apple's public lookup API on
 * 2026-09-03:
 *   https://itunes.apple.com/lookup?id=6803675364&country=CA
 *
 * Do not edit these by hand from memory. Re-run the lookup and copy the result.
 */

/** Apple's numeric app identifier (`trackId`). */
export const APP_ID = '6803675364'

/** Bundle identifier shipped in the binary. */
export const BUNDLE_ID = 'com.blackwateraquatics.spawnos'

/**
 * Canonical download link.
 *
 * The geo-neutral `/app/id…` form 301s each visitor to their own storefront
 * (verified: → /us/… from a US edge). Prefer it for every user-facing link and
 * for schema installUrl/downloadUrl so a German or Australian breeder does not
 * land on the Canadian storefront.
 */
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_ID}`

/**
 * Storefront-pinned form, as reported by Apple as `trackViewUrl`. Useful when a
 * link must be unambiguous (e.g. structured data `sameAs`).
 */
export const APP_STORE_URL_CA = `https://apps.apple.com/ca/app/spawnos/id${APP_ID}`

/** Public release of 1.0 (`releaseDate`). */
export const RELEASE_DATE = '2026-09-01'

/** Current public version (`version`). */
export const APP_VERSION = '1.0'

/** Minimum supported iOS (`minimumOsVersion`). */
export const MIN_IOS_VERSION = '17.0'

/**
 * Platform truth. iPhone only, today.
 *
 * There is no Android build, no iPad-optimised build and no web app that
 * replaces the phone app. Never widen this string to chase a keyword.
 */
export const PLATFORM = 'iOS 17.0 or later'

/** App Store price. The app is free to download; Pro is billed on the web. */
export const APP_STORE_PRICE = 'Free'

/**
 * App Store categories, in Apple's order (`genres`).
 *
 * Recorded here because the primary category is an ASO decision, not a fact the
 * site should restate as a product claim.
 */
export const APP_STORE_CATEGORIES = ['Lifestyle', 'Productivity'] as const

/**
 * Ratings.
 *
 * `userRatingCount` is 0 on the live listing. Nothing in this codebase may emit
 * `aggregateRating`, `ratingValue` or `reviewCount` until real ratings exist —
 * fabricating them is a manual-action risk and a lie to customers.
 */
export const HAS_PUBLIC_RATINGS = false

/**
 * Marketing URL registered on the App Store listing (`sellerUrl`).
 * Apple links visitors here from the listing, so this page must always reflect
 * the app's real, current availability.
 */
export const APP_MARKETING_URL = '/app'

/** Storefronts confirmed to serve the listing (spot-checked 2026-09-03). */
export const AVAILABLE_STOREFRONTS = ['CA', 'US', 'GB', 'AU', 'DE', 'JP'] as const

/**
 * App Store seller name as it appears publicly.
 *
 * NOTE: the listing currently shows an individual developer name, not
 * "Blackwater Aquatics Canada". The website, schema graph and Blackwater
 * integration all state the Blackwater relationship correctly, but the App
 * Store listing itself does not yet reinforce it. Changing this requires an
 * App Store Connect legal-entity change and cannot be done from this repo.
 */
export const APP_STORE_SELLER_NAME = 'jaeden doody'
