import { NextResponse } from "next/server";

/**
 * Where a shopper wants their order delivered.
 *
 * Two ways in, both free and neither needing an API key:
 *
 *   ?pin=141001        India Post's own directory. This is the Amazon India
 *                      flow — type six digits, get told which town that is.
 *   ?lat=..&lon=..     OpenStreetMap's reverse geocoder, for "use my current
 *                      location". The browser supplies the coordinates; this
 *                      turns them into a PIN, which is then looked up the same
 *                      way as a typed one so both paths end at the same answer.
 *
 * Google's Geocoding API would do both, but it requires a billing-enabled key,
 * and this does the job for Indian addresses without one.
 *
 * Both calls happen here rather than in the browser. Nominatim asks callers to
 * identify themselves and rate-limits, so the request needs one User-Agent we
 * control rather than each visitor's own; and answers can be cached here for
 * everyone instead of being fetched again per person. A PIN code's town does
 * not change, so the cache is a long one.
 */

const DAY = 60 * 60 * 24;

export interface Place {
  readonly pincode: string;
  readonly city: string;
  readonly state: string;
}

const bad = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

/** India Post: six digits in, a district and state out. */
async function byPin(pin: string): Promise<Place | null> {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
    next: { revalidate: DAY },
  }).catch(() => null);
  if (!res || !res.ok) return null;

  const body = (await res.json().catch(() => null)) as
    | [{ Status?: string; PostOffice?: { District?: string; State?: string }[] }]
    | null;
  const first = body?.[0];
  if (first?.Status !== "Success" || !first.PostOffice?.length) return null;

  const office = first.PostOffice[0]!;
  if (!office.District || !office.State) return null;
  return { pincode: pin, city: office.District, state: office.State };
}

/** Coordinates in, a PIN out — then the same lookup as a typed one. */
async function byCoords(lat: number, lon: number): Promise<Place | null> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18` +
    `&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "zylo-shop/1.0 (+https://zylo.shopping)" },
    next: { revalidate: DAY },
  }).catch(() => null);
  if (!res || !res.ok) return null;

  const body = (await res.json().catch(() => null)) as
    | { address?: Record<string, string> }
    | null;
  const a = body?.address;
  if (!a) return null;

  const pin = (a.postcode ?? "").replace(/\s/g, "");
  // Prefer India Post's own answer for the town, so a PIN typed by hand and a
  // PIN found from GPS never disagree about what to call the same place.
  if (/^\d{6}$/.test(pin)) {
    const official = await byPin(pin);
    if (official) return official;
  }

  const city = a.city ?? a.town ?? a.village ?? a.suburb ?? a.county;
  const state = a.state;
  if (!city || !state) return null;
  return { pincode: /^\d{6}$/.test(pin) ? pin : "", city, state };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const pin = params.get("pin");
  if (pin !== null) {
    if (!/^\d{6}$/.test(pin.trim())) return bad("A PIN code is six digits.");
    const place = await byPin(pin.trim());
    return place
      ? NextResponse.json(place)
      : bad("We could not find that PIN code.", 404);
  }

  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180)
      return bad("Those coordinates are not on Earth.");
    const place = await byCoords(lat, lon);
    return place
      ? NextResponse.json(place)
      : bad("We could not work out your area. Try typing a PIN code.", 404);
  }

  return bad("Pass a pin, or a lat and lon.");
}
