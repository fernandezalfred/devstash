import {
  Code,
  File,
  Image,
  Link,
  Sparkles,
  StickyNote,
  Terminal,
  type LucideIcon,
} from "lucide-react";

export interface HomepageItemType {
  name: string;
  label: string;
  Icon: LucideIcon;
  color: string;
}

// Mirrors the real system item types (prisma/seed.ts) — same names, icons,
// and colors the app actually uses, not placeholder marketing colors.
export const HOMEPAGE_ITEM_TYPES: HomepageItemType[] = [
  { name: "snippet", label: "Snippets", Icon: Code, color: "#3b82f6" },
  { name: "prompt", label: "Prompts", Icon: Sparkles, color: "#8b5cf6" },
  { name: "command", label: "Commands", Icon: Terminal, color: "#f97316" },
  { name: "note", label: "Notes", Icon: StickyNote, color: "#fde047" },
  { name: "file", label: "Files", Icon: File, color: "#6b7280" },
  { name: "image", label: "Images", Icon: Image, color: "#ec4899" },
  { name: "link", label: "Links", Icon: Link, color: "#10b981" },
];
