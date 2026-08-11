"use client";

import { useState } from "react";
import QuickEntry from "./QuickEntry";
import TodayActivity from "./TodayActivity";
import TemplatePanel from "./TemplatePanel";
import type { Province } from "@/lib/regions";

export default function Dashboard({
  currentUserId,
  currentUserName,
  role,
  assignedRegions,
}: {
  currentUserId: string;
  currentUserName: string;
  role: "AGENT" | "ADMIN";
  assignedRegions: Province[];
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <QuickEntry currentUserId={currentUserId} role={role} onRegistered={() => setRefreshKey((k) => k + 1)} />
      <TodayActivity currentUserId={currentUserId} role={role} refreshKey={refreshKey} />
      <TemplatePanel currentUserName={currentUserName} assignedRegions={assignedRegions} />
    </div>
  );
}
