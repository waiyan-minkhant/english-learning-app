type StackGroupProps = {
  title: string;
  description: string;
  items: { name: string; role: string }[];
};

export function StackGroup({ title, description, items }: StackGroupProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li
            key={item.name}
            className="flex items-center justify-between gap-4 px-6 py-4"
          >
            <span className="font-medium text-slate-900">{item.name}</span>
            <span className="text-right text-sm text-slate-500">{item.role}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
