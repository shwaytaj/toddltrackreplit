import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface ProductCardProps {
  image: string;
  title: string;
  description: string;
  link?: string;
}

export default function ProductCard({ image, title, description, link = '#' }: ProductCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate" data-testid="card-product">
      <div className="flex gap-3 p-3">
        <img 
          src={image} 
          alt={title}
          className="w-20 h-20 object-cover rounded-md flex-shrink-0"
        />
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <p className="text-xs font-medium mb-1">amazon</p>
            <p className="text-sm font-medium leading-tight line-clamp-2">{title}</p>
          </div>
          <Button 
            size="sm" 
            className="w-fit bg-accent hover:bg-accent/90 text-accent-foreground rounded-full mt-2"
            onClick={() => window.open(link, '_blank')}
            data-testid="button-buy-now"
          >
            Buy now <ExternalLink className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
