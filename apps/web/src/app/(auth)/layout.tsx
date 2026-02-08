export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pf-container">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}

