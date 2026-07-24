import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidSlug } from '@/lib/slug';

// GET /api/check-slug?slug=farrapos&excludeId=<uuid> (spec-010, Passo 1).
// Usa a função is_slug_available (SECURITY DEFINER) em vez de uma query
// direta em restaurants — a RLS da tabela restringe SELECT ao próprio
// dono, então uma query comum sempre reportaria "disponível" para slugs
// de outros donos (ver comentário na migration 20260724030000).
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug') ?? '';
  const excludeId = request.nextUrl.searchParams.get('excludeId') || null;

  if (!isValidSlug(slug)) {
    return NextResponse.json({ available: false, reason: 'invalid' });
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc('is_slug_available', {
    check_slug: slug,
    exclude_id: excludeId,
  });

  if (error) {
    return NextResponse.json({ available: false, reason: 'error' }, { status: 500 });
  }

  return NextResponse.json({ available: Boolean(data) });
}
