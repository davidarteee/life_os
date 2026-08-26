"use client";

import { CalendarDays } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { useT } from "@/hooks/use-t";

export default function CalendarPage() {
  const { t } = useT();
  return (
    <PageContainer wide>
      <PageHeader title={t("calendar.title")} description={t("calendar.subtitle")} icon={<CalendarDays className="size-5" />} />
      <MonthCalendar />
    </PageContainer>
  );
}
