import { Check } from "lucide-react";

import { Reveal } from "@/components/homepage/Reveal";
import { Section } from "@/components/homepage/Section";

const CHECKLIST = [
  "Automatic tag suggestions on every save",
  "One-click AI summaries for long snippets and docs",
  '"Explain this code" for any snippet',
  "Prompt optimizer for your saved AI prompts",
];

const TAGS = ["react", "hooks", "typescript", "debounce"];

export function AISection() {
  return (
    <Section id="ai">
      <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
        {/* min-w-0: grid items default to min-width:auto, so the wide <pre>
            below would otherwise force this track wider than the viewport
            instead of scrolling within its own card (bug found + fixed the
            same way in the prototypes/homepage mockup). */}
        <Reveal className="min-w-0">
          <span className="inline-block rounded-full bg-gradient-to-br from-amber-500 to-pink-500 px-3 py-1 text-xs font-bold tracking-wide text-amber-950 uppercase">
            Pro Feature
          </span>
          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Let AI do the busywork
          </h2>
          <p className="mt-3 text-muted-foreground">
            DevStash Pro tags, summarizes, and explains your knowledge
            automatically.
          </p>
          <ul className="mt-6 flex flex-col gap-3.5">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-500">
                  <Check className="size-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="min-w-0">
          <div className="overflow-hidden rounded-xl border border-border bg-[#0d0d13] shadow-2xl shadow-black/40">
            <div className="flex items-center gap-1.5 border-b border-border bg-[#16161f] px-3.5 py-2.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-xs text-muted-foreground">useDebounce.ts</span>
            </div>
            <pre className="overflow-x-auto p-4.5 font-mono text-[12.5px] leading-relaxed text-[#d4d4dc]">
              <code>
                <span className="text-purple-400">import</span>{" "}
                {"{ useEffect, useState }"}{" "}
                <span className="text-purple-400">from</span>{" "}
                <span className="text-green-400">&quot;react&quot;</span>;{"\n\n"}
                <span className="text-purple-400">export function</span>{" "}
                <span className="text-sky-400">useDebounce</span>
                {"<T>(value: T, delay = "}
                <span className="text-red-400">300</span>
                {"): T {\n"}
                {"  "}
                <span className="text-purple-400">const</span> [debounced,
                setDebounced] ={" "}
                <span className="text-sky-400">useState</span>(value);{"\n\n"}
                {"  "}
                <span className="text-sky-400">useEffect</span>(() =&gt; {"{\n"}
                {"    "}
                <span className="text-purple-400">const</span> id ={" "}
                <span className="text-sky-400">setTimeout</span>(() =&gt;{" "}
                <span className="text-sky-400">setDebounced</span>(value),
                delay);{"\n"}
                {"    "}
                <span className="text-purple-400">return</span> () =&gt;{" "}
                <span className="text-sky-400">clearTimeout</span>(id);{"\n"}
                {"  "}
                {"}, [value, delay]);\n\n"}
                {"  "}
                <span className="text-purple-400">return</span> debounced;
                {"\n}"}
              </code>
            </pre>
            <div className="flex flex-wrap items-center gap-2 border-t border-border bg-[#101018] px-4.5 py-3.5">
              <span className="mr-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                AI Generated Tags
              </span>
              {TAGS.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-violet-400/30 bg-violet-400/15 px-2.5 py-1 text-[11px] text-violet-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
