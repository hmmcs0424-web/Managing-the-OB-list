"use client";

import { useState } from "react";
import QuickEntry from "./QuickEntry";
import TodayActivity from "./TodayActivity";

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <QuickEntry onRegistered={() => setRefreshKey((k) => k + 1)} />
      <TodayActivity refreshKey={refreshKey} />
    </div>
  );
}
