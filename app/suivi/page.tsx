import { OrderTracking } from '@/components/store/order-tracking'
import { StoreShell } from '@/components/store/shell'

export default async function TrackingPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams
  return (
    <StoreShell>
      {!id ? <div className="mx-auto max-w-md px-4 py-24 text-center text-muted-foreground">Ajoutez l’identifiant de la commande dans le lien de suivi.</div> : <OrderTracking id={id} />}
    </StoreShell>
  )
}