import { StatusBadge } from "./status-badge";

type FeatureCardProps = {
  title: string;
  description: string;
  status: "live" | "soon";
  tags?: string[];
};

export function FeatureCard({
  title,
  description,
  status,
  tags = []
}: FeatureCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-shadow hover:shadow-elevated">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="text-sm leading-6 text-slate-600">{description}</p>
      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
