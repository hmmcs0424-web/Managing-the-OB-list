import { prisma } from "@/lib/db";
import { kstStartOfToday, kstHour } from "@/lib/time";

export interface TodayStats {
  total: number;
  success: number;
  hourly: { hour: number; total: number; success: number }[];
  agents: { agentName: string; total: number; success: number }[];
}

export async function getTodayStats(): Promise<TodayStats> {
  const logs = await prisma.callLog.findMany({
    where: { createdAt: { gte: kstStartOfToday() } },
    select: {
      createdAt: true,
      dispatchSuccess: true,
      agent: { select: { id: true, name: true } },
    },
  });

  const hourlyMap = new Map<number, { total: number; success: number }>();
  const agentMap = new Map<string, { agentName: string; total: number; success: number }>();

  for (const log of logs) {
    const hour = kstHour(log.createdAt);
    const hourBucket = hourlyMap.get(hour) ?? { total: 0, success: 0 };
    hourBucket.total += 1;
    if (log.dispatchSuccess) hourBucket.success += 1;
    hourlyMap.set(hour, hourBucket);

    const agentBucket = agentMap.get(log.agent.id) ?? {
      agentName: log.agent.name,
      total: 0,
      success: 0,
    };
    agentBucket.total += 1;
    if (log.dispatchSuccess) agentBucket.success += 1;
    agentMap.set(log.agent.id, agentBucket);
  }

  const hourly = Array.from(hourlyMap.entries())
    .map(([hour, v]) => ({ hour, ...v }))
    .sort((a, b) => a.hour - b.hour);

  const agents = Array.from(agentMap.values()).sort((a, b) => b.total - a.total);

  return {
    total: logs.length,
    success: logs.filter((l) => l.dispatchSuccess).length,
    hourly,
    agents,
  };
}
