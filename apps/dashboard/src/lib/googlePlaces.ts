// Interpreta o link do Google Business colado pelo dono (spec-010, Passo 2)
// para chegar a um place_id, ou a uma query de busca quando o link não traz
// o place_id diretamente. Links encurtados (maps.app.goo.gl, g.co) não são
// resolvidos aqui — precisariam seguir o redirect, fora do escopo desta
// função pura; o texto colado vira a query de busca nesse caso.
export interface ParsedGoogleLink {
  placeId: string | null;
  searchQuery: string | null;
}

export function parseGoogleBusinessLink(input: string): ParsedGoogleLink {
  const trimmed = input.trim();
  if (!trimmed) return { placeId: null, searchQuery: null };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    // Não é uma URL válida — trata como texto de busca livre (nome do restaurante).
    return { placeId: null, searchQuery: trimmed };
  }

  // Google usa nomes de parâmetro diferentes conforme o tipo de link:
  // "place_id"/"query_place_id" em links de compartilhamento do Maps,
  // "placeid" (sem underscore) no formato usado pelo link de review que
  // esta própria função gera (buildGoogleReviewLink) — aceitar os dois
  // cobre o caso do dono colar de volta um link que o Remy já gerou.
  const placeId =
    url.searchParams.get('place_id') ??
    url.searchParams.get('query_place_id') ??
    url.searchParams.get('placeid');
  if (placeId) return { placeId, searchQuery: null };

  const placeMatch = url.pathname.match(/\/place\/([^/]+)/);
  if (placeMatch) {
    const name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    return { placeId: null, searchQuery: name || null };
  }

  // URL reconhecida mas sem place_id nem /place/ no path (ex: link
  // encurtado, ou só o cid) — nada de útil pra extrair sem seguir redirect.
  return { placeId: null, searchQuery: null };
}

export function buildGoogleReviewLink(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}
