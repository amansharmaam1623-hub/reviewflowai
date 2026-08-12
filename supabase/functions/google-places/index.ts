import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ── CORS (required for Supabase Edge Functions) ──
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Logging helpers ──
function logInfo(label: string, details?: Record<string, unknown>) {
  console.log(`[google-places] ${label}`, details ?? {});
}
function logError(label: string, err: unknown, extra?: Record<string, unknown>) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[google-places] ${label}: ${msg}`, {
    extra,
    stack: err instanceof Error ? err.stack : undefined,
  });
}

// ── Types ──
interface AutocompleteRequest {
  action: "autocomplete";
  input: string;
}
interface DetailsRequest {
  action: "details";
  placeId: string;
}
type FunctionRequest = AutocompleteRequest | DetailsRequest;

interface BusinessSuggestion {
  placeId: string;
  name: string;
  address: string;
  fullDescription: string;
}

interface PlaceDetails {
  name: string;
  address: string;
  fullDescription: string;
  website: string;
  phone: string;
  mapsUrl: string;
  reviewUrl: string;
  category: string;
  rating: number | null;
  ratingCount: number | null;
}

// ── Google Places API (New) v1 ──
// Docs:
//   Autocomplete (New): POST https://places.googleapis.com/v1/places:autocomplete
//   Place Details (New): GET  https://places.googleapis.com/v1/places/{placeId}
const PLACES_BASE = "https://places.googleapis.com/v1";

// Autocomplete (New)
// Request body: { input, languageCode, regionCode }
// Response: { suggestions: [{ placePrediction: { placeId, text, structuredFormat, types } }] }
async function autocomplete(input: string, apiKey: string): Promise<BusinessSuggestion[]> {
  const url = `${PLACES_BASE}/places:autocomplete`;
  const body = {
    input,
    languageCode: "en",
    regionCode: "IN",
  };

  logInfo("autocomplete request", { url, input });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places Autocomplete (New) HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();
  const suggestions: any[] = data?.suggestions ?? [];

  const results: BusinessSuggestion[] = suggestions
    .filter((s) => s?.placePrediction?.placeId)
    .map((s) => {
      const pp = s.placePrediction;
      const name = pp?.structuredFormat?.mainText?.text ?? pp?.text?.text ?? "";
      const address = pp?.structuredFormat?.secondaryText?.text ?? "";
      const fullDescription = pp?.text?.text ?? `${name}, ${address}`.trim();
      return {
        placeId: pp.placeId as string,
        name,
        address,
        fullDescription,
      };
    });

  logInfo("autocomplete response", { count: results.length });
  return results;
}

// Place Details (New)
// Uses X-Goog-FieldMask to request only the fields we need.
// Response fields: displayName.text, formattedAddress, internationalPhoneNumber,
//   nationalPhoneNumber, websiteUri, googleMapsUri, rating, userRatingCount,
//   primaryTypeDisplayName.text, types[]
async function placeDetails(placeId: string, apiKey: string): Promise<PlaceDetails> {
  const fields = [
    "id",
    "displayName",
    "formattedAddress",
    "internationalPhoneNumber",
    "nationalPhoneNumber",
    "websiteUri",
    "googleMapsUri",
    "rating",
    "userRatingCount",
    "primaryTypeDisplayName",
    "types",
  ].join(",");

  const url = `${PLACES_BASE}/places/${encodeURIComponent(placeId)}?languageCode=en`;

  logInfo("place details request", { placeId, url });

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fields,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Place Details (New) HTTP ${res.status}: ${text}`);
  }

  const d = await res.json();

  const name = d?.displayName?.text ?? "";
  const address = d?.formattedAddress ?? "";
  const phone = d?.internationalPhoneNumber ?? d?.nationalPhoneNumber ?? "";
  const website = d?.websiteUri ?? "";
  const mapsUrl = d?.googleMapsUri ?? "";
  const rating = typeof d?.rating === "number" ? d.rating : null;
  const ratingCount = typeof d?.userRatingCount === "number" ? d.userRatingCount : null;
  const category = d?.primaryTypeDisplayName?.text
    ?? (Array.isArray(d?.types) && d.types.length > 0
      ? d.types[0].replace(/_/g, " ")
      : "");
  const fullDescription = address || name;
  // Google's write-a-review deep link keyed on the place ID.
  const reviewUrl = placeId
    ? `https://search.google.com/local/writereview?placeid=${placeId}`
    : "";

  const details: PlaceDetails = {
    name,
    address,
    fullDescription,
    website,
    phone,
    mapsUrl,
    reviewUrl,
    category,
    rating,
    ratingCount,
  };

  logInfo("place details response", {
    placeId,
    name,
    hasWebsite: Boolean(website),
    rating,
    ratingCount,
  });
  return details;
}

// ── Handler ──
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) {
    logError("config", new Error("GOOGLE_PLACES_API_KEY secret is not set"));
    return json(
      {
        error:
          "Google Places API key is not configured. Set the GOOGLE_PLACES_API_KEY edge function secret.",
      },
      500,
    );
  }

  let body: FunctionRequest;
  try {
    body = await req.json();
  } catch (err) {
    logError("parse", err);
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { action } = body;
  if (!action) {
    logInfo("rejected", { reason: "missing action" });
    return json(
      { error: "Missing 'action' field (expected 'autocomplete' or 'details')" },
      400,
    );
  }

  logInfo("invoke", { action });

  try {
    if (action === "autocomplete") {
      const { input } = body as AutocompleteRequest;
      if (!input || input.trim().length < 2) {
        logInfo("autocomplete skipped", { reason: "input too short" });
        return json({ suggestions: [] });
      }
      const suggestions = await autocomplete(input.trim(), apiKey);
      return json({ suggestions });
    }

    if (action === "details") {
      const { placeId } = body as DetailsRequest;
      if (!placeId) {
        logInfo("details rejected", { reason: "missing placeId" });
        return json({ error: "Missing 'placeId' field" }, 400);
      }
      const details = await placeDetails(placeId, apiKey);
      return json(details);
    }

    logInfo("rejected", { reason: "unknown action", action });
    return json(
      { error: `Unknown action '${action}'. Expected 'autocomplete' or 'details'.` },
      400,
    );
  } catch (err) {
    logError(action, err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return json({ error: `Google Places request failed: ${message}` }, 502);
  }
});
