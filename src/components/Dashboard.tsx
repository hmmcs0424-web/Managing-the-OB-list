"use client";

import { useState } from "react";
import EntryChecker from "./EntryChecker";
import DriverList from "./DriverList";

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <EntryChecker onRegistered={() => setRefreshKey((k) => k + 1)} />
      <DriverList refreshKey={refreshKey} />
    </div>
  );
}
