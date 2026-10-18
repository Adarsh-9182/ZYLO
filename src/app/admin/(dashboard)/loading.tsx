export default function Loading() {
  return (
    <div aria-label="Loading dashboard" className="animate-pulse">
      <div className="h-9 w-60 rounded-lg bg-slate-200" />
      <div className="mt-4 h-4 w-80 max-w-full rounded bg-slate-200" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 rounded-xl bg-white" />
        ))}
      </div>
      <div className="mt-6 h-80 rounded-xl bg-white" />
    </div>
  );
}
