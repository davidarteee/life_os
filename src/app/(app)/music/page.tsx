"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { Music } from "lucide-react";

export default function Page() {
  return <ComingSoon titleKey="nav.music" icon={Music} points={["Spotify mini-player (OAuth)", "Now playing, playlists, search", ]} />;
}