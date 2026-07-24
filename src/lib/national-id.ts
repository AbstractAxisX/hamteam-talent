// Iranian National ID (کد ملی) validation — checksum algorithm
// Implemented server-side only.

export function validateNationalId(input: string): boolean {
  const code = (input || "").replace(/\D/g, "");
  if (code.length !== 10) return false;
  if (/^(\d)\1{9}$/.test(code)) return false; // all same digits

  const digits = code.split("").map(Number);
  const check = digits[9];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  const remainder = sum % 11;
  const expected = remainder < 2 ? remainder : 11 - remainder;
  return expected === check;
}

export function normalizePhone(input: string): string {
  let p = (input || "").replace(/\D/g, "");
  if (p.startsWith("0098")) p = "0" + p.slice(4);
  else if (p.startsWith("98")) p = "0" + p.slice(2);
  if (!p.startsWith("0")) p = "0" + p;
  return p;
}

export function isValidIranPhone(input: string): boolean {
  const p = normalizePhone(input);
  return /^09\d{9}$/.test(p);
}
