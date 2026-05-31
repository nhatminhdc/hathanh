function normalizePhone(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('84')) digits = `0${digits.slice(2)}`;
  if (digits.length === 9 && digits.startsWith('9')) digits = `0${digits}`;
  return digits;
}

function isValidVnPhone(phone) {
  const normalized = normalizePhone(phone);
  return /^0(3|5|7|8|9)\d{8}$/.test(normalized);
}

module.exports = { normalizePhone, isValidVnPhone };
