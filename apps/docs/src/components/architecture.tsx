type FlowStep = {
  label: string;
  detail?: string;
};

type FlowDiagramProps = {
  title: string;
  steps: FlowStep[];
};

export function FlowDiagram({ title, steps }: FlowDiagramProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <ol className="space-y-0">
        {steps.map((step, index) => (
          <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
            {index < steps.length - 1 ? (
              <span
                aria-hidden
                className="absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px bg-slate-200"
              />
            ) : null}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
              {index + 1}
            </span>
            <div className="pt-0.5">
              <p className="font-medium text-slate-900">{step.label}</p>
              {step.detail ? (
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {step.detail}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

type ArchBoxProps = {
  title: string;
  items: string[];
  accent?: "brand" | "slate" | "emerald" | "amber";
};

const accentClasses = {
  brand: "border-brand-200 bg-brand-50 text-brand-900",
  slate: "border-slate-200 bg-slate-50 text-slate-900",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900"
};

export function ArchBox({ title, items, accent = "slate" }: ArchBoxProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${accentClasses[accent]}`}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-70">
        {title}
      </p>
      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item} className="font-mono text-[13px]">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

type ModuleGridProps = {
  modules: { name: string; path: string; responsibility: string }[];
};

export function ModuleGrid({ modules }: ModuleGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {modules.map((mod) => (
        <div
          key={mod.name}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-card"
        >
          <p className="font-semibold text-slate-900">{mod.name}</p>
          <p className="mt-1 font-mono text-xs text-brand-600">{mod.path}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {mod.responsibility}
          </p>
        </div>
      ))}
    </div>
  );
}

type CodeBlockProps = {
  title?: string;
  children: string;
};

export function CodeBlock({ title, children }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-card">
      {title ? (
        <div className="border-b border-slate-800 px-4 py-2 text-xs font-medium text-slate-400">
          {title}
        </div>
      ) : null}
      <pre className="overflow-x-auto p-4 text-sm leading-6 text-slate-300">
        <code>{children}</code>
      </pre>
    </div>
  );
}
