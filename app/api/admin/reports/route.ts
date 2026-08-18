import 'server-only'

import { NextResponse } from 'next/server'

import { handleApiError } from '@/lib/api-error-response'
import { requireStaff } from '@/lib/auth/admin-guard'
import { getFinanceReport } from '@/lib/services/analytics'

export async function GET() {
  try {
    await requireStaff()
    const rows: Array<Record<string, string | number | null>> = await getFinanceReport()
    const headers = ['Numéro', 'Client', 'Téléphone', 'Total', 'Statut', 'Date']
    const csv = [
      headers.join(','),
      ...rows.map((row: Record<string, string | number | null>) =>
        headers
          .map((key) => JSON.stringify(row[key] ?? ''))
          .join(',')
      ),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="rapport_financier.csv"',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
