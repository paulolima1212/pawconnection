# 0002. Google Places for dog-friendly map pins

Date: 2026-09-13
Status: Accepted

## Context
The social feed map originally showed nearby pet parents. In map mode the filters still targeted posts (city, author, pet size). Users need filters that surface **dog-friendly places of interest** near them, personalized from onboarding interests and pet preferences — similar to Facebook Places (nearby + category chips + radius), not a dedicated Facebook “dogs allowed” filter.

Place data must not leak a Google API key in the mobile app. Android Maps SDK keys are often app-restricted and cannot call Places Nearby from the server.

## Decision
Keep places inside the existing `map` bounded context:

- Domain rules choose Google types, drop non dog-friendly results, and rank by the viewer’s featured category.
- `IPlacesSearch` is a port; `GooglePlacesSearch` calls Places API (New) `places:searchNearby` with `GOOGLE_PLACES_API_KEY`.
- HTTP: `GET /map/places?latitude=&longitude=&radiusKm=&category=forYou|parks|services|cafes|all`.
- The app map mode replaces post filters with radius + place category. Pins are dog-friendly places; people pins remain for discovery.

Dog-friendly policy:

- Always include `dog_park`, `veterinary_care`, `pet_store`.
- Include `park` unless Google sets `allowsDogs: false`.
- Include cafés/restaurants only when `allowsDogs: true`.

## Consequences
Positive: server-side key, testable ranking, map filters match the user’s cadastro.

Negative: empty results if the Places key is missing or Places API (New) is disabled; café coverage depends on Google’s `allowsDogs` field.

Follow-up: verify `lz-plima1212` GCP key restrictions, cache Nearby responses, and optional “open now” chip.
