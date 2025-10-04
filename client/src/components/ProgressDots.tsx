export default function ProgressDots({ 
  total, 
  current 
}: { 
  total: number; 
  current: number; 
}) {
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full transition-colors ${
            i === current ? 'bg-foreground' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  );
}
