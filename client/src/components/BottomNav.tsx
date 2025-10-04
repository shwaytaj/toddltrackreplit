import { Home, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  active: 'home' | 'milestones' | 'profile';
  onNavigate: (page: 'home' | 'milestones' | 'profile') => void;
}

export default function BottomNav({ active, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'milestones' as const, label: 'Milestones', icon: Star },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#2C3E50] text-white rounded-t-3xl px-4 py-3 shadow-lg">
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
                isActive && "bg-white/10"
              )}
              data-testid={`nav-${item.id}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
