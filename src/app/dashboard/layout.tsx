import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="flex items-center gap-4 px-6 h-14 border-b border-border shrink-0">
        <span className="text-lg font-semibold tracking-tight mr-4">DevStash</span>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9" />
        </div>
        <div className="ml-auto">
          <Button size="sm">
            <Plus className="size-4" />
            New Item
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar placeholder */}
        <aside className="w-56 border-r border-border shrink-0 p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Sidebar</h2>
        </aside>

        {/* Main area placeholder */}
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-sm font-medium text-muted-foreground">Main</h2>
          {children}
        </main>
      </div>
    </div>
  );
}
