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

  const summaryRows = drivers.map((d) => {
    const last = d.callLogs[0];
    return {
      이름: d.name,
      차량번호: d.plate ?? "",
      전화번호: d.phoneDisplay,
      재전화거부: d.doNotCall ? "Y" : "",
      최신상태: last ? STATUS_LABELS[last.status as CallStatus] : "",
      배차성공이력: d.callLogs.some((l) => l.dispatchSuccess) ? "Y" : "",
      최근메모: last?.memo ?? "",
      최근담당자: last?.agent.name ?? "",
      최근일시: last ? last.createdAt.toLocaleString("ko-KR") : "",
      총통화횟수: d.callLogs.length,
    };
  });

  const historyRows = drivers.flatMap((d) =>
    d.callLogs.map((log) => ({
      이름: d.name,
      차량번호: d.plate ?? "",
      전화번호: d.phoneDisplay,
      재전화거부: d.doNotCall ? "Y" : "",
      상태: STATUS_LABELS[log.status as CallStatus],
      배차성공: log.dispatchSuccess ? "Y" : "",
      메모: log.memo ?? "",
      담당자: log.agent.name,
      일시: log.createdAt.toLocaleString("ko-KR"),
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(summaryRows),
    "차주별 최신상태"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(historyRows),
    "전체 통화 이력"
  );

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer as Buffer;
}
