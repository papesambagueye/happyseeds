export function StorefrontStatus({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Boutique</p>
      <h2 className="mt-3 text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-amber-800/80">{message}</p>
    </div>
  )
}
