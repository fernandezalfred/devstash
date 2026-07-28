import { type CollectionOption } from "@/lib/db/collections";
import { cn } from "@/lib/utils";

// Multi-select checkbox list for linking an item to collections on create/edit.
// A simple checkbox list rather than a Select/Combobox primitive — this repo
// deliberately avoids adding a UI-kit dependency for pickers (see the
// item-type selector in CreateItemDialog).
export function CollectionsPicker({
  options,
  selected,
  onChange,
}: {
  options: CollectionOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No collections yet.</p>
    );
  }

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  };

  return (
    <div
      className={cn(
        "max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2",
      )}
    >
      {options.map((option) => (
        <label
          key={option.id}
          className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted"
        >
          <input
            type="checkbox"
            className="size-4 rounded border-border"
            checked={selected.includes(option.id)}
            onChange={() => toggle(option.id)}
          />
          {option.name}
        </label>
      ))}
    </div>
  );
}
