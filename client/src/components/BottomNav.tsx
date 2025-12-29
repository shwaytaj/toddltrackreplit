import { Home, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavPage = 'home' | 'milestones' | 'reports' | 'profile';

interface BottomNavProps {
  active: NavPage;
  onNavigate: (page: NavPage) => void;
}

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  const navItems: { id: NavPage; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'milestones', label: 'Milestones', icon: Star },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground rounded-t-3xl px-4 py-3 shadow-xl border-t border-primary">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors hover-elevate active-elevate-2",
                isActive && "bg-primary-foreground/20 text-primary-foreground"
              )}
              data-testid={`nav-${item.id}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
