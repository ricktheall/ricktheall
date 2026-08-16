import type { Metadata } from "next";

import { JourneyDashboard } from "@/components/journey-dashboard";

export const metadata: Metadata = {
  title: "การเดินทางของฉัน — TheAll Bible Coffee",
  description: "คุณอ่านถึงไหนแล้ว และแก้วใบไหนรอคุณอยู่",
};

export default function JourneyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10 sm:pt-14">
      <JourneyDashboard />
    </div>
  );
}
