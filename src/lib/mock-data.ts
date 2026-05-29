// Single source of truth for mock data used by the dashboard UI
// until the database is wired up. Plain data only — no helpers.

export type ContentType = "text" | "url" | "file";

export interface ItemType {
  id: string;
  name: string; // display name (e.g. "Snippet")
  slug: string; // route slug (e.g. "snippets")
  kind: ContentType;
  icon: string; // lucide icon name
  color: string; // hex
  isSystem: boolean;
  isPro: boolean;
}

export interface Item {
  id: string;
  title: string;
  typeId: string; // -> ItemType.id
  description?: string;
  content?: string; // text body (text types)
  url?: string; // for link type
  fileName?: string; // for file/image types
  fileSize?: number; // bytes
  language?: string; // syntax highlight hint
  tags: string[];
  collectionIds: string[]; // -> Collection.id
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  itemCount: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  isPro: boolean;
}

// ---------- Current user ----------

export const currentUser: User = {
  id: "user_1",
  name: "John Doe",
  email: "demo@devstash.io",
  isPro: true,
};

// ---------- Item types (system defaults) ----------

export const itemTypes: ItemType[] = [
  {
    id: "type_snippet",
    name: "Snippet",
    slug: "snippets",
    kind: "text",
    icon: "Code",
    color: "#3b82f6",
    isSystem: true,
    isPro: false,
  },
  {
    id: "type_prompt",
    name: "Prompt",
    slug: "prompts",
    kind: "text",
    icon: "Sparkles",
    color: "#8b5cf6",
    isSystem: true,
    isPro: false,
  },
  {
    id: "type_command",
    name: "Command",
    slug: "commands",
    kind: "text",
    icon: "Terminal",
    color: "#f97316",
    isSystem: true,
    isPro: false,
  },
  {
    id: "type_note",
    name: "Note",
    slug: "notes",
    kind: "text",
    icon: "StickyNote",
    color: "#fde047",
    isSystem: true,
    isPro: false,
  },
  {
    id: "type_link",
    name: "Link",
    slug: "links",
    kind: "url",
    icon: "Link",
    color: "#10b981",
    isSystem: true,
    isPro: false,
  },
  {
    id: "type_file",
    name: "File",
    slug: "files",
    kind: "file",
    icon: "File",
    color: "#6b7280",
    isSystem: true,
    isPro: true,
  },
  {
    id: "type_image",
    name: "Image",
    slug: "images",
    kind: "file",
    icon: "Image",
    color: "#ec4899",
    isSystem: true,
    isPro: true,
  },
];

// ---------- Collections ----------

export const collections: Collection[] = [
  {
    id: "col_react",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    itemCount: 12,
    isFavorite: true,
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "col_python",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    itemCount: 8,
    isFavorite: false,
    createdAt: "2024-01-03T00:00:00.000Z",
    updatedAt: "2024-01-10T00:00:00.000Z",
  },
  {
    id: "col_context",
    name: "Context Files",
    description: "AI context files for projects",
    itemCount: 5,
    isFavorite: true,
    createdAt: "2024-01-04T00:00:00.000Z",
    updatedAt: "2024-01-12T00:00:00.000Z",
  },
  {
    id: "col_interview",
    name: "Interview Prep",
    description: "Technical interview preparation",
    itemCount: 24,
    isFavorite: false,
    createdAt: "2024-01-05T00:00:00.000Z",
    updatedAt: "2024-01-14T00:00:00.000Z",
  },
  {
    id: "col_git",
    name: "Git Commands",
    description: "Frequently used git commands",
    itemCount: 15,
    isFavorite: true,
    createdAt: "2024-01-06T00:00:00.000Z",
    updatedAt: "2024-01-13T00:00:00.000Z",
  },
  {
    id: "col_ai",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    itemCount: 18,
    isFavorite: false,
    createdAt: "2024-01-07T00:00:00.000Z",
    updatedAt: "2024-01-11T00:00:00.000Z",
  },
];

// ---------- Items ----------

export const items: Item[] = [
  {
    id: "item_useauth",
    title: "useAuth Hook",
    typeId: "type_snippet",
    description: "Custom authentication hook for React applications",
    content: `import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}`,
    language: "typescript",
    tags: ["react", "auth", "hooks"],
    collectionIds: ["col_react"],
    isFavorite: true,
    isPinned: true,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "item_api_error",
    title: "API Error Handling Pattern",
    typeId: "type_snippet",
    description: "Fetch wrapper with exponential backoff retry logic",
    content: `async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options)
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
      return await res.json()
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise((r) => setTimeout(r, 2 ** i * 1000))
    }
  }
}`,
    language: "javascript",
    tags: ["fetch", "error-handling", "async"],
    collectionIds: ["col_react"],
    isFavorite: false,
    isPinned: true,
    createdAt: "2024-01-12T00:00:00.000Z",
    updatedAt: "2024-01-12T00:00:00.000Z",
  },
  {
    id: "item_refactor_prompt",
    title: "Refactor for Readability",
    typeId: "type_prompt",
    description: "Prompt to clean up and refactor a code block",
    content:
      "Refactor the following code for readability and maintainability. Keep the behavior identical, add concise comments only where intent is non-obvious, and explain the key changes you made.",
    tags: ["refactor", "code-quality"],
    collectionIds: ["col_ai"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-09T00:00:00.000Z",
    updatedAt: "2024-01-09T00:00:00.000Z",
  },
  {
    id: "item_git_undo",
    title: "Undo Last Commit",
    typeId: "type_command",
    description: "Reset the last commit but keep the changes staged",
    content: "git reset --soft HEAD~1",
    language: "bash",
    tags: ["git", "reset"],
    collectionIds: ["col_git"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-08T00:00:00.000Z",
    updatedAt: "2024-01-08T00:00:00.000Z",
  },
  {
    id: "item_squash",
    title: "Squash Last N Commits",
    typeId: "type_command",
    description: "Interactively squash the most recent commits",
    content: "git rebase -i HEAD~3",
    language: "bash",
    tags: ["git", "rebase"],
    collectionIds: ["col_git"],
    isFavorite: true,
    isPinned: false,
    createdAt: "2024-01-07T00:00:00.000Z",
    updatedAt: "2024-01-07T00:00:00.000Z",
  },
  {
    id: "item_bigo_note",
    title: "Big-O Cheat Sheet",
    typeId: "type_note",
    description: "Time complexity reference for common operations",
    content:
      "## Big-O Cheat Sheet\n\n- Array access: O(1)\n- Hash lookup: O(1) avg\n- Binary search: O(log n)\n- Linear scan: O(n)\n- Sorting: O(n log n)\n- Nested loops: O(n²)",
    tags: ["algorithms", "complexity"],
    collectionIds: ["col_interview"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-06T00:00:00.000Z",
    updatedAt: "2024-01-06T00:00:00.000Z",
  },
  {
    id: "item_python_dedupe",
    title: "Dedupe a List Preserving Order",
    typeId: "type_snippet",
    description: "Remove duplicates from a list while keeping first-seen order",
    content: "def dedupe(items):\n    return list(dict.fromkeys(items))",
    language: "python",
    tags: ["python", "list"],
    collectionIds: ["col_python"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-05T00:00:00.000Z",
    updatedAt: "2024-01-05T00:00:00.000Z",
  },
  {
    id: "item_nextjs_docs",
    title: "Next.js App Router Docs",
    typeId: "type_link",
    description: "Official documentation for the App Router",
    url: "https://nextjs.org/docs/app",
    tags: ["nextjs", "docs"],
    collectionIds: ["col_react"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-04T00:00:00.000Z",
    updatedAt: "2024-01-04T00:00:00.000Z",
  },
  {
    id: "item_claude_context",
    title: "claude.md",
    typeId: "type_file",
    description: "Project context file for AI agents",
    fileName: "claude.md",
    fileSize: 8412,
    tags: ["ai", "context"],
    collectionIds: ["col_context"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-03T00:00:00.000Z",
    updatedAt: "2024-01-03T00:00:00.000Z",
  },
  {
    id: "item_arch_diagram",
    title: "System Architecture Diagram",
    typeId: "type_image",
    description: "High-level architecture overview",
    fileName: "architecture.png",
    fileSize: 245760,
    tags: ["architecture", "diagram"],
    collectionIds: ["col_context"],
    isFavorite: false,
    isPinned: false,
    createdAt: "2024-01-02T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
  },
];
