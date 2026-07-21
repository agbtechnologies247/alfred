import { Search, Sparkles, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';

export function Topbar() {
  const navigate = useNavigate();
  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4">
      {/* Brand logo & name on top */}
      <div className="flex items-center gap-2.5 mr-6 shrink-0">
        <img src="/alfred-logo.png" alt="A.L.F.R.E.D. Logo" className="w-6 h-6 object-contain" />
        <span className="font-extrabold text-sm tracking-wide text-foreground">A.L.F.R.E.D.</span>
      </div>

      {/* Left section - Search */}
      <div className="flex-1 max-w-md">
        <Button variant="outline" className="w-full justify-start text-muted-foreground h-9 relative">
          <Search className="w-4 h-4 mr-2" />
          <span>Search or Command (Ctrl+K)...</span>
          <kbd className="absolute right-2 top-1.5 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate({ to: '/agents' })}
          className="gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Assistant</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <UserCircle className="w-6 h-6 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
}
