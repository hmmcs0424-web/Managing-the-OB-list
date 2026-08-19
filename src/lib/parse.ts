import { normalizePhone } from "./phone";

export interface ParsedRow {
  raw: string;
  name?: string;
  plate?: string;
  phoneRaw?: string;
  phoneNormalized?: string;
  error?: string;
}

export function parsePasteText(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((raw) => {
    const parts = raw
      .split(/[,\t]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length < 2) {
      return { raw, error: "형식 오류 (이름, 전화번호 순서로 입력)" };
    }

    const [name, phoneRaw] = parts;
    const phoneNormalized = normalizePhone(phoneRaw);

    if (phoneNormalized.length < 9) {
      return { raw, name, phoneRaw, error: "전화번호 형식을 확인해주세요" };
    }

    return { raw, name, plate: "", phoneRaw, phoneNormalized };
  });
}
