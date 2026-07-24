// Gera e valida o slug público do restaurante (remy.app.br/[slug]).
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (marcas diacríticas combinantes)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // qualquer sequência de não-alfanumérico (espaço, _, pontuação, hífens repetidos) vira um hífen
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, ''); // o corte em 60 pode deixar um hífen sobrando na ponta
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 60;
}
