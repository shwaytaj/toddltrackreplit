import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Child {
  id: string;
  name: string;
  photo?: string;
}

interface ChildSelectorProps {
  children: Child[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function ChildSelector({ children, activeId, onSelect }: ChildSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {children.map((child) => {
        const isActive = child.id === activeId;
        const initials = child.name.substring(0, 2).toUpperCase();
        
        return (
          <Badge
            key={child.id}
            variant={isActive ? "default" : "secondary"}
            className={cn(
              "px-4 py-2 cursor-pointer hover-elevate active-elevate-2 rounded-full flex items-center gap-2",
              isActive && "bg-primary text-primary-foreground"
            )}
            onClick={() => onSelect(child.id)}
            data-testid={`selector-child-${child.id}`}
          >
            <Avatar className="w-5 h-5">
              <AvatarImage src={child.photo} alt={child.name} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            {child.name}
          </Badge>
        );
      })}
    </div>
  );
}
