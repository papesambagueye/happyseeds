'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Erreur</p>
        <h1 className="mt-3 text-2xl font-bold">La boutique est temporairement indisponible.</h1>
        <p className="mt-2 text-sm leading-relaxed text-amber-800/80">
          Nous avons rencontré un problème technique. Merci de réessayer dans quelques instants.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Réessayer
        </button>
      </div>
    </main>
  )
}
