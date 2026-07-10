export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-lg font-semibold text-slate-900">{children}</h2>
  );
}

export function SubSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 text-base font-semibold text-slate-900">{children}</h3>
  );
}
