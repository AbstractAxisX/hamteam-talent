// Persian formatting helpers

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFa(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function formatFaDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function formatFaDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export function timeAgoFa(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "لحظاتی پیش";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${toFa(min)} دقیقه پیش`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${toFa(hr)} ساعت پیش`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${toFa(day)} روز پیش`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `${toFa(mon)} ماه پیش`;
  const yr = Math.floor(mon / 12);
  return `${toFa(yr)} سال پیش`;
}

export function formatCount(n: number): string {
  if (n < 1000) return toFa(n);
  if (n < 1_000_000) return toFa((n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)) + " هزار";
  return toFa((n / 1_000_000).toFixed(1)) + " میلیون";
}
