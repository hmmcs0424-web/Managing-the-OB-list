import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { STATUS_LABELS, type CallStatus } from "@/lib/status";

export async function buildDriverWorkbook(): Promise<Buffer> {
  const drivers = await prisma.driver.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      callLogs: {
        orderBy: { createdAt: "desc" },
        include: { agent: { select: { name: true } } },
      },
    },
  });

  const summaryRows = drivers.map((driver) => {
    const latest = driver.callLogs[0];
    return {
      고객명: driver.name,
      차량번호: driver.plate ?? "",
      전화번호: driver.phoneDisplay,
      "재전화 거부": driver.doNotCall ? "Y" : "N",
      "총 통화 건수": driver.callLogs.length,
      "배차 건수": driver.callLogs.filter((log) => log.dispatchSuccess).length,
      "최근 통화 상태": latest ? STATUS_LABELS[latest.status as CallStatus] : "",
      "최근 상담사": latest?.agent.name ?? "",
      "최근 작성일시": latest?.createdAt ?? null,
      "최근 메모": latest?.memo ?? "",
    };
  });

  let sequence = 0;
  const rawRows = drivers.flatMap((driver) =>
    driver.callLogs.map((log) => ({
      순번: ++sequence,
      작성일시: log.createdAt,
      상담사: log.agent.name,
      고객명: driver.name,
      차량번호: driver.plate ?? "",
      전화번호: driver.phoneDisplay,
      "통화 상태": STATUS_LABELS[log.status as CallStatus],
      "배차 성공": log.dispatchSuccess ? "Y" : "N",
      "재전화 거부": driver.doNotCall ? "Y" : "N",
      메모: log.memo ?? "",
    }))
  );

  const agentRows = Array.from(
    rawRows.reduce((map, row) => {
      const key = row.상담사;
      const current = map.get(key) ?? {
        상담사: key,
        "OB 건수": 0,
        "고객 수": new Set<string>(),
        "배차 건수": 0,
      };
      current["OB 건수"] += 1;
      current["고객 수"].add(row.전화번호);
      if (row["배차 성공"] === "Y") current["배차 건수"] += 1;
      map.set(key, current);
      return map;
    }, new Map<string, { 상담사: string; "OB 건수": number; "고객 수": Set<string>; "배차 건수": number }>()).values()
  ).map((row) => ({
    상담사: row.상담사,
    "OB 건수": row["OB 건수"],
    "고객 수": row["고객 수"].size,
    "배차 건수": row["배차 건수"],
    배차율: row["OB 건수"] ? row["배차 건수"] / row["OB 건수"] : 0,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rawRows), "OB 원시 데이터");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(agentRows), "상담사별 요약");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), "고객별 요약");

  for (const sheet of Object.values(workbook.Sheets)) {
    if (!sheet["!ref"]) continue;
    sheet["!autofilter"] = { ref: sheet["!ref"] };
    sheet["!cols"] = Array.from(
      { length: XLSX.utils.decode_range(sheet["!ref"]).e.c + 1 },
      (_, index) => ({ wch: index === 1 ? 20 : 14 })
    );
  }

  setColumnFormat(workbook.Sheets["OB 원시 데이터"], rawRows.length, 1, "yyyy-mm-dd hh:mm:ss");
  setColumnFormat(workbook.Sheets["상담사별 요약"], agentRows.length, 4, "0.0%");
  setColumnFormat(workbook.Sheets["고객별 요약"], summaryRows.length, 8, "yyyy-mm-dd hh:mm:ss");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function setColumnFormat(sheet: XLSX.WorkSheet, rowCount: number, column: number, format: string) {
  for (let row = 1; row <= rowCount; row += 1) {
    const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })];
    if (cell) cell.z = format;
  }
}
