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
    // 엑셀의 탭이 브라우저 입력창에서 공백으로 바뀌는 경우까지 허용합니다.
    // 줄 끝의 전화번호를 기준으로 분리하므로 이름에 공백이 있어도 처리됩니다.
    const match = raw.match(/^(.+?)(?:\s*[,\t]\s*|\s+)(0[\d\s-]{8,})$/);

    if (!match) {
      return { raw, error: "형식 오류 (이름, 전화번호 순서로 입력)" };
    }

    const name = match[1].trim();
    const phoneRaw = match[2].trim();
    const phoneNormalized = normalizePhone(phoneRaw);

    if (phoneNormalized.length < 9) {
      return { raw, name, phoneRaw, error: "전화번호 형식을 확인해주세요" };
    }

    return { raw, name, plate: "", phoneRaw, phoneNormalized };
  });
}
