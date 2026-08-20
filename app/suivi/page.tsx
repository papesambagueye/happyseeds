import { OrderTracking } from '@/components/store/order-tracking'

export default async function TrackingPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  if (!id) return <div className="mx-auto max-w-md px-4 py-24 text-center text-muted-foreground">Ajoutez l’identifiant de la commande dans le lien de suivi.</div>
  return <OrderTracking id={id} />
}