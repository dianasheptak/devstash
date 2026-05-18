import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ============================================
// SYSTEM ITEM TYPES
// ============================================
const systemItemTypes = [
  { name: "snippet", icon: "Code", color: "#3b82f6", isSystem: true },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6", isSystem: true },
  { name: "command", icon: "Terminal", color: "#f97316", isSystem: true },
  { name: "note", icon: "StickyNote", color: "#fde047", isSystem: true },
  { name: "file", icon: "File", color: "#6b7280", isSystem: true },
  { name: "image", icon: "Image", color: "#ec4899", isSystem: true },
  { name: "link", icon: "Link", color: "#10b981", isSystem: true },
];

async function main() {
  console.log("Seeding database...\n");

  // ============================================
  // SYSTEM ITEM TYPES
  // ============================================
  console.log("Seeding system item types...");
  for (const type of systemItemTypes) {
    const existing = await prisma.itemType.findFirst({
      where: { name: type.name, isSystem: true },
    });
    if (!existing) {
      await prisma.itemType.create({ data: type });
    }
  }

  const types = await prisma.itemType.findMany({ where: { isSystem: true } });
  const typeMap = Object.fromEntries(types.map((t) => [t.name, t]));

  // ============================================
  // DEMO USER
  // ============================================
  console.log("Seeding demo user...");

  // Clean slate — cascade deletes items, collections, accounts, sessions
  await prisma.user.deleteMany({ where: { email: "demo@devstash.io" } });

  const hashedPassword = await bcrypt.hash("12345678", 12);

  const user = await prisma.user.create({
    data: {
      email: "demo@devstash.io",
      name: "Demo User",
      password: hashedPassword,
      isPro: false,
      emailVerified: new Date(),
    },
  });

  // ============================================
  // REACT PATTERNS COLLECTION
  // ============================================
  console.log("Seeding React Patterns collection...");
  await prisma.collection.create({
    data: {
      name: "React Patterns",
      description: "Reusable React patterns and hooks",
      userId: user.id,
      items: {
        create: [
          {
            item: {
              create: {
                title: "useDebounce Hook",
                contentType: "TEXT",
                language: "typescript",
                description: "Delays updating a value until after a specified delay. Useful for search inputs.",
                userId: user.id,
                itemTypeId: typeMap.snippet.id,
                content: `import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;`,
              },
            },
          },
          {
            item: {
              create: {
                title: "Context Provider Pattern",
                contentType: "TEXT",
                language: "typescript",
                description: "Type-safe React context with a custom hook and provider component.",
                userId: user.id,
                itemTypeId: typeMap.snippet.id,
                content: `import { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}`,
              },
            },
          },
          {
            item: {
              create: {
                title: "Common Utility Functions",
                contentType: "TEXT",
                language: "typescript",
                description: "cn, formatDate, truncate, and sleep helpers used across most projects.",
                userId: user.id,
                itemTypeId: typeMap.snippet.id,
                content: `export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function truncate(str: string, length: number): string {
  return str.length > length ? \`\${str.slice(0, length)}...\` : str;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}`,
              },
            },
          },
        ],
      },
    },
  });

  // ============================================
  // AI WORKFLOWS COLLECTION
  // ============================================
  console.log("Seeding AI Workflows collection...");
  await prisma.collection.create({
    data: {
      name: "AI Workflows",
      description: "AI prompts and workflow automations",
      userId: user.id,
      items: {
        create: [
          {
            item: {
              create: {
                title: "Code Review Prompt",
                contentType: "TEXT",
                description: "Structured prompt for thorough code reviews with actionable feedback.",
                userId: user.id,
                itemTypeId: typeMap.prompt.id,
                content: `You are an expert code reviewer. Review the following code and provide:

1. **Critical Issues** — bugs, security vulnerabilities, or logic errors
2. **Performance** — inefficiencies or optimization opportunities
3. **Best Practices** — style, readability, and maintainability improvements
4. **Suggestions** — optional enhancements

Be specific and actionable. Reference line numbers where relevant.

\`\`\`
[PASTE CODE HERE]
\`\`\``,
              },
            },
          },
          {
            item: {
              create: {
                title: "Documentation Generator",
                contentType: "TEXT",
                description: "Generates clean Markdown docs from any function or module.",
                userId: user.id,
                itemTypeId: typeMap.prompt.id,
                content: `Generate comprehensive documentation for the following code. Include:

1. **Overview** — what this code does in 1-2 sentences
2. **Parameters/Props** — each parameter with type, description, and whether required
3. **Return Value** — what is returned and its type
4. **Usage Example** — a realistic code example
5. **Edge Cases** — important limitations or gotchas

Format in Markdown. Keep it concise but complete.

\`\`\`
[PASTE CODE HERE]
\`\`\``,
              },
            },
          },
          {
            item: {
              create: {
                title: "Refactoring Assistant",
                contentType: "TEXT",
                description: "Improves readability, removes duplication, and strengthens TypeScript types.",
                userId: user.id,
                itemTypeId: typeMap.prompt.id,
                content: `Refactor the following code with these goals:

1. **Readability** — clearer naming and better structure
2. **DRY** — eliminate repetition
3. **Performance** — improve efficiency where possible
4. **Type Safety** — stronger TypeScript types if applicable

Show the refactored version with a brief explanation of each change.

\`\`\`
[PASTE CODE HERE]
\`\`\``,
              },
            },
          },
        ],
      },
    },
  });

  // ============================================
  // TERMINAL COMMANDS COLLECTION
  // ============================================
  console.log("Seeding Terminal Commands collection...");
  await prisma.collection.create({
    data: {
      name: "Terminal Commands",
      description: "Useful shell skills for everyday development",
      userId: user.id,
      items: {
        create: [
          {
            item: {
              create: {
                title: "Git Operations",
                contentType: "TEXT",
                language: "bash",
                description: "Undo commits, discard changes, branch management, and interactive rebase.",
                userId: user.id,
                itemTypeId: typeMap.command.id,
                content: `# Undo last commit (keep changes staged)
git reset --soft HEAD~1

# Discard all local changes
git checkout -- .

# Create and push a new branch
git checkout -b feature/my-feature && git push -u origin feature/my-feature

# Interactive rebase last 3 commits
git rebase -i HEAD~3`,
              },
            },
          },
          {
            item: {
              create: {
                title: "Docker Commands",
                contentType: "TEXT",
                language: "bash",
                description: "Prune system, run with env file, tail logs, exec into container.",
                userId: user.id,
                itemTypeId: typeMap.command.id,
                content: `# Remove all stopped containers, unused images, and volumes
docker system prune -af --volumes

# Run a container with env file
docker run --env-file .env -p 3000:3000 myapp

# Tail logs for a running container
docker logs -f container_name

# Open a shell in a running container
docker exec -it container_name sh`,
              },
            },
          },
          {
            item: {
              create: {
                title: "Process Management",
                contentType: "TEXT",
                language: "bash",
                description: "Find and kill processes by port, monitor resources, check disk usage.",
                userId: user.id,
                itemTypeId: typeMap.command.id,
                content: `# Find process using a port
lsof -i :3000

# Kill process on a port
kill -9 $(lsof -t -i:3000)

# Monitor system resources interactively
htop

# Show disk usage by directory, sorted by size
du -sh */ | sort -hr`,
              },
            },
          },
          {
            item: {
              create: {
                title: "Package Manager Utilities",
                contentType: "TEXT",
                language: "bash",
                description: "Check outdated, update all, audit vulnerabilities, list globals.",
                userId: user.id,
                itemTypeId: typeMap.command.id,
                content: `# Check for outdated packages
npm outdated

# Update all packages to latest
npx npm-check-updates -u && npm install

# Audit and fix vulnerabilities
npm audit fix

# List globally installed packages
npm list -g --depth=0`,
              },
            },
          },
        ],
      },
    },
  });

  console.log("\nSeeding complete!");
  console.log(`  User:        demo@devstash.io`);
  console.log(`  Item types:  ${types.length}`);
  console.log(`  Collections: 3`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
