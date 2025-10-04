export default function Logo({ className = "" }: { className?: string }) {
  return (
    <h1 className={`font-accent text-2xl ${className}`}>
      toddl
    </h1>
  );
}
