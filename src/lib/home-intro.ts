/**
 * The homepage intro (race_content.homepage_intro) is "Heading\nParagraph".
 * Some races store it as one line ("Heading. Paragraph…"), which used to put
 * the whole paragraph in the <h2>: a short first sentence becomes the heading,
 * a long one means there is no heading.
 */
const MAX_HEADING = 80;

export function splitIntro(text: string): { heading: string | null; body: string } {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) return { heading: lines[0], body: lines.slice(1).join('\n') };
  const one = lines[0] ?? '';
  const m = one.match(/^([^.!?]+)[.!?]\s+([\s\S]+)$/);
  if (m && m[1].length <= MAX_HEADING) return { heading: m[1].trim(), body: m[2].trim() };
  return { heading: null, body: one };
}
