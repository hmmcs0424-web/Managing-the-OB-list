import { prisma } from "@/lib/db";
import { kstDateKey, kstHour } from "@/lib/time";

export interface PerformanceStats {
  total: number;
  success: number;
  daily: { date: string; total: number; success: number }[];
  hourly: { hour: number; total: number; success: number }[];
  agents: { agentId: string; agentName: string; total: number; customers: number; success: number }[];
}

export async function getPerformanceStats(from: string, to: string): Promise<PerformanceStats> {
  const logs = await prisma.callLog.findMany({
    where: {
      createdAt: {
        gte: new Date(`${from}T00:00:00+09:00`),
        lte: new Date(`${to}T23:59:59.999+09:00`),
      },
    },
    select: {
      createdAt: true,
      status: true,
      driverId: true,
      agent: { select: { id: true, name: true } },
    },
  });

  const dailyMap = new Map<string, { total: number; success: number }>();
  const hourlyMap = new Map<number, { total: number; success: number }>();
  const agentMap = new Map<string, { agentId: string; agentName: string; total: number; customerIds: Set<string>; success: number }>();

  for (const log of logs) {
    const success = log.status === "ACCEPTED";
    const date = kstDateKey(log.createdAt);
    const dayBucket = dailyMap.get(date) ?? { total: 0, success: 0 };
    dayBucket.total += 1;
    if (success) dayBucket.success += 1;
    dailyMap.set(date, dayBucket);

    const hour = kstHour(log.createdAt);
    const hourBucket = hourlyMap.get(hour) ?? { total: 0, success: 0 };
    hourBucket.total += 1;
    if (success) hourBucket.success += 1;
    hourlyMap.set(hour, hourBucket);

    const agentBucket = agentMap.get(log.agent.id) ?? { agentId: log.agent.id, agentName: log.agent.name, total: 0, customerIds: new Set<string>(), success: 0 };
    agentBucket.total += 1;
    agentBucket.customerIds.add(log.driverId);
    if (success) agentBucket.success += 1;
    agentMap.set(log.agent.id, agentBucket);
  }

  return {
    total: logs.length,
    success: logs.filter((log) => log.status === "ACCEPTED").length,
    daily: Array.from(dailyMap.entries()).map(([date, value]) => ({ date, ...value })).sort((a, b) => a.date.localeCompare(b.date)),
    hourly: Array.from(hourlyMap.entries()).map(([hour, value]) => ({ hour, ...value })).sort((a, b) => a.hour - b.hour),
    agents: Array.from(agentMap.values()).map(({ customerIds, ...agent }) => ({ ...agent, customers: customerIds.size })).sort((a, b) => b.total - a.total),
  };
}
