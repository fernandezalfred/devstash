import { FolderOpen, Search, type LucideIcon } from "lucide-react";

import { HOMEPAGE_ITEM_TYPES } from "@/components/homepage/item-types";
import { Reveal } from "@/components/homepage/Reveal";
import { Section } from "@/components/homepage/Section";

function colorFor(typeName: string): string {
  return HOMEPAGE_ITEM_TYPES.find((t) => t.name === typeName)!.color;
}

// Reuses the real item-type icon/color for the four features that map
// directly to a system type (snippet, prompt, command, file); "Instant
// Search" and "Collections" aren't item types, so they get a standalone
// icon plus one of the two remaining type colors, keeping all 7 in play.
const FEATURES: { Icon: LucideIcon; color: string; title: string; description: string }[] = [
  {
    Icon: HOMEPAGE_ITEM_TYPES[0].Icon,
    color: colorFor("snippet"),
    title: "Code Snippets",
    description:
      "Save reusable code with syntax highlighting and language tags, ready to copy in one click.",
  },
  {
    Icon: HOMEPAGE_ITEM_TYPES[1].Icon,
    color: colorFor("prompt"),
    title: "AI Prompts",
    description:
      "Keep your best prompts, system messages, and workflows so you never rewrite them from scratch.",
  },
  {
    Icon: Search,
    color: colorFor("note"),
    title: "Instant Search",
    description:
      "Full-text search across content, tags, titles, and types — find anything in milliseconds.",
  },
  {
    Icon: HOMEPAGE_ITEM_TYPES[2].Icon,
    color: colorFor("command"),
    title: "Commands",
    description:
      "Stash the terminal one-liners you always forget, organized and one search away.",
  },
  {
    Icon: HOMEPAGE_ITEM_TYPES[4].Icon,
    color: colorFor("file"),
    title: "Files & Docs",
    description:
      "Upload reference files, context docs, and images without losing track of them again.",
  },
  {
    Icon: FolderOpen,
    color: colorFor("link"),
    title: "Collections",
    description:
      "Group related items into color-coded collections for projects, patterns, or workflows.",
  },
];

export function Features() {
  return (
    <Section id="features">
      <Reveal className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">Everything, in one place</h2>
        <p className="mt-3 text-muted-foreground">
          One fast hub for every kind of developer knowledge.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ Icon, color, title, description }) => (
          <Reveal key={title}>
            <div
              className="h-full rounded-xl border border-t-[3px] border-border bg-card p-6 transition-transform hover:-translate-y-1"
              style={{ borderTopColor: color }}
            >
              <div
                className="mb-4 flex size-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${color}29`, color }}
              >
                <Icon className="size-5" />
              </div>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
