"use client";

import { useState } from "react";
import QuickEntry from "./QuickEntry";
import TodayActivity from "./TodayActivity";

export default function Dashboard({
  currentUserId,
  role,
}: {
  currentUserId: string;
  role: "AGENT" | "ADMIN";
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <QuickEntry currentUserId={currentUserId} role={role} onRegistered={() => setRefreshKey((k) => k + 1)} />
      <TodayActivity currentUserId={currentUserId} role={role} refreshKey={refreshKey} />
    </div>
  );
}
