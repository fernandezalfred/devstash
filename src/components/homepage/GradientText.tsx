export function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-br from-blue-500 via-blue-400 to-pink-500 bg-clip-text text-transparent">
      {children}
    </span>
  );
}
