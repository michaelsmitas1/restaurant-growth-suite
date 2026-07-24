import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseGoogleBusinessLink, buildGoogleReviewLink } from '@/lib/googlePlaces';

// POST /api/verify-google-business (spec-010, Passo 2) — server-side
// porque usa GOOGLE_PLACES_API_KEY (nunca exposta ao cliente).
export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Verificação do Google Business não está configurada neste ambiente.' },
      { status: 500 }
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const link = typeof body?.link === 'string' ? body.link.trim() : '';
  if (!link) {
    return NextResponse.json({ error: 'Cole o link do seu Google Business.' }, { status: 400 });
  }

  const { placeId: directPlaceId, searchQuery } = parseGoogleBusinessLink(link);
  let placeId = directPlaceId;

  if (!placeId) {
    if (!searchQuery) {
      return NextResponse.json(
        { error: 'Não reconhecemos esse link. Cole o link da sua página no Google Maps ou digite o nome do restaurante.' },
        { status: 422 }
      );
    }

    const findRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id&key=${apiKey}`
    );
    const findJson = await findRes.json();
    placeId = findJson?.candidates?.[0]?.place_id ?? null;

    if (!placeId) {
      return NextResponse.json({ error: 'Não encontramos esse restaurante no Google.' }, { status: 404 });
    }
  }

  const detailsRes = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,formatted_address,type,photo&key=${apiKey}`
  );
  const detailsJson = await detailsRes.json();

  if (detailsJson?.status !== 'OK' || !detailsJson.result) {
    return NextResponse.json({ error: 'Não conseguimos confirmar esse restaurante no Google.' }, { status: 404 });
  }

  const result = detailsJson.result;
  const photoRef: string | undefined = result.photos?.[0]?.photo_reference;
  const photoUrl = photoRef
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`
    : null;

  return NextResponse.json({
    placeId,
    name: result.name ?? null,
    address: result.formatted_address ?? null,
    types: result.types ?? [],
    photoUrl,
    reviewLink: buildGoogleReviewLink(placeId),
  });
}
