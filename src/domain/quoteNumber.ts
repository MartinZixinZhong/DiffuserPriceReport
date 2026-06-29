import { pinyin } from "pinyin-pro";

export function compactDate(date: string): string {
  return date.replaceAll("-", "");
}

export function customerInitials(customerName: string): string {
  const cleaned = customerName.trim();
  if (!cleaned) return "KH";

  const initials = cleaned
    .split(/\s+/)
    .map((part) => {
      if (/^[A-Za-z0-9]+$/.test(part)) {
        if (/^[A-Z0-9]{2,}$/.test(part)) {
          return part.toUpperCase();
        }

        return part.slice(0, 1).toUpperCase();
      }

      return pinyin(part, {
        nonZh: "removed",
        pattern: "first",
        toneType: "none"
      }).toUpperCase();
    })
    .join("")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);

  return initials || "KH";
}

export function generateQuoteNumber(customerName: string, date: string): string {
  return `GM-${customerInitials(customerName)}-${compactDate(date)}`;
}
