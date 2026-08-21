const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX_LENGTH = 120;

export function validateSlug(slug: string): string | null {
  if (slug.length === 0) {
    return "Slug is required";
  }
  if (slug.length > SLUG_MAX_LENGTH) {
    return "Slug must be 120 characters or fewer";
  }
  if (!SLUG_PATTERN.test(slug)) {
    return "Slug must contain only lowercase letters, numbers, and hyphens";
  }
  return null;
}
