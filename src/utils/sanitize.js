const escapeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => escapeMap[char]);
