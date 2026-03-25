import { redirect } from 'next/navigation'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canManageResidents, canViewResidents } from '@/lib/permissions'
import { getSafeServerUser } from '@/lib/supabase/server'

type ResidentProfile = {
  id: string
  role: string
  full_name?: string | null
  email?: string | null
  property_id?: string | null
  location_id?: string | null
  unit_number?: string | null
}

export type ResidentsSession = {
  supabase: ReturnType<typeof createSupabaseAdminClient>
  user: Awaited<ReturnType<typeof getSafeServerUser>>
  profile: ResidentProfile
  propertyId: string | null
  isManager: boolean
}

export function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value || 0)
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0)
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export async function getResidentsSession(requireManager = false): Promise<ResidentsSession> {
  const user = await getSafeServerUser()
  if (!user) redirect('/login')

  const supabase = createSupabaseAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !canViewResidents(profile as any)) redirect('/hub')

  const isManager = canManageResidents(profile as any)
  if (requireManager && !isManager) redirect('/residentes')

  let propertyId = (profile as any).property_id || (profile as any).location_id || null

  if (!propertyId && ['admin', 'corporate_admin'].includes((profile as any).role)) {
    const { data: locations } = await supabase
      .from('locations')
      .select('id')
      .eq('is_active', true)
      .order('name')
      .limit(2)

    if ((locations || []).length === 1) {
      propertyId = locations?.[0]?.id || null
    }
  }

  return {
    supabase,
    user,
    profile: profile as ResidentProfile,
    propertyId,
    isManager,
  }
}

export async function getResidentsOverview(propertyId: string | null) {
  if (!propertyId) {
    return {
      units: 0,
      residents: 0,
      delinquent: 0,
      occupiedUnits: 0,
      monthlyFees: 0,
    }
  }

  const supabase = createSupabaseAdminClient()
  const [unitsRes, residentsRes, invoicesRes, finesRes] = await Promise.all([
    supabase.from('community_units').select('id, unit_number, monthly_fee').eq('property_id', propertyId).eq('is_active', true),
    supabase.from('profiles').select('id, unit_number').eq('property_id', propertyId).eq('role', 'resident'),
    supabase.from('invoices').select('resident_id, unit_id').eq('property_id', propertyId).in('status', ['pending', 'overdue']),
    supabase.from('fines').select('resident_id, unit_id').eq('property_id', propertyId).in('status', ['unpaid', 'appealed']),
  ])

  const units = unitsRes.data || []
  const residents = residentsRes.data || []
  const occupiedUnitSet = new Set(residents.map((resident) => resident.unit_number).filter(Boolean))
  const delinquentSet = new Set<string>()

  for (const invoice of invoicesRes.data || []) {
    const key = `${invoice.resident_id || 'none'}-${invoice.unit_id || 'none'}`
    delinquentSet.add(key)
  }

  for (const fine of finesRes.data || []) {
    const key = `${fine.resident_id || 'none'}-${fine.unit_id || 'none'}`
    delinquentSet.add(key)
  }

  return {
    units: units.length,
    residents: residents.length,
    delinquent: delinquentSet.size,
    occupiedUnits: occupiedUnitSet.size,
    monthlyFees: units.reduce((sum, unit) => sum + Number(unit.monthly_fee || 0), 0),
  }
}
