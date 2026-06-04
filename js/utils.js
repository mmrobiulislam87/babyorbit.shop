/** Shared helpers */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function normalizeBdPhone(input) {
  let digits = String(input).replace(/[^\d]/g, '');
  if (digits.startsWith('880')) digits = '0' + digits.slice(3);
  if (digits.startsWith('88') && digits.length === 13) digits = '0' + digits.slice(2);
  return digits;
}

function isValidBdPhone(input) {
  const phone = normalizeBdPhone(input);
  return /^01[3-9]\d{8}$/.test(phone);
}

function formatPhoneDisplay(phone) {
  return normalizeBdPhone(phone);
}
