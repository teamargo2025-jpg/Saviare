const stripDiacritics = (value) =>
  Array.from(value.normalize('NFD'))
    .filter((char) => {
      const code = char.codePointAt(0);
      return code < 0x0300 || code > 0x036f;
    })
    .join('');

export const slugify = (value) =>
  stripDiacritics(value.toString())
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
