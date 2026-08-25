"use client";

import { useEffect, useState } from "react";
import { useUserId } from "@/components/providers/session-provider";
import { Textarea } from "@/components/ui/textarea";

/** Frictionless scratchpad, persisted per user in localStorage. */
export function QuickNoteWidget() {
  const uid = useUserId();
  const key = `lifeos:quicknote:${uid ?? "anon"}`;
  const [value, setValue] = useState("");

  useEffect(() => {
    if (typeof localStorage !== "undefined") setValue(localStorage.getItem(key) ?? "");
  }, [key]);

  return (
    <Textarea
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        if (typeof localStorage !== "undefined") localStorage.setItem(key, e.target.value);
      }}
      placeholder="Jot something down…"
      className="h-full min-h-32 resize-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0"
    />
  );
}
