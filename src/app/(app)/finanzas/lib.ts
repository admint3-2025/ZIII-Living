import { redirect } from 'next/navigation'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { canManageFinances, canViewFinances } from '@/lib/permissions'
import { getSafeServerUser } from '@/lib/supabase/server'

type ProfileRecord = {
  id: string
  role: string
  full_name?: string | null
  email?: string | null
  property_id?: string | null
  location_id?: string | null
  unit_number?: string | null
}

type NumericLike = number | string | null | undefined

export type FinanceSession = {
  supabase: ReturnType<typeof createSupabaseAdminClient>
  user: Awaited<ReturnType<typeof getSafeServerUser>>
  profile: ProfileRecord
  propertyId: string | null
  isManager: boolean
}

export type FinanceCatalogs = {
  categories: any[]
  bankAccounts: any[]
  units: any[]
  residents: any[]
}

function asNumber(value: NumericLike) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatCurrency(value: NumericLike) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(asNumber(value))
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export async function getFinanceSession(requireManager = false): Promise<FinanceSession> {
  const user = await getSafeServerUser()
  if (!user) redirect('/login')

  const supabase = createSupabaseAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !canViewFinances(profile as any)) redirect('/hub')

  const isManager = canManageFinances(profile as any)
  if (requireManager && !isManager) redirect('/finanzas')

  const propertyId = (profile as any).property_id || (profile as any).location_id || null

  return {
    supabase,
    user,
    profile: profile as ProfileRecord,
    propertyId,
    isManager,
  }
}

export async function getFinanceCatalogs(propertyId: string | null): Promise<FinanceCatalogs> {
  if (!propertyId) {
    return { categories: [], bankAccounts: [], units: [], residents: [] }
  }

  const supabase = createSupabaseAdminClient()
  const [categoriesRes, bankAccountsRes, unitsRes, residentsRes] = await Promise.all([
    supabase
      .from('financial_categories')
      .select('*')
      .or(`property_id.is.null,property_id.eq.${propertyId}`)
      .order('type')
      .order('name'),
    supabase
      .from('bank_accounts')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .order('account_alias'),
    supabase
      .from('community_units')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .order('unit_number'),
    supabase
      .from('profiles')
      .select('id, full_name, unit_number')
      .eq('property_id', propertyId)
      .eq('role', 'resident')
      .order('full_name'),
  ])

  return {
    categories: categoriesRes.data || [],
    bankAccounts: bankAccountsRes.data || [],
    units: unitsRes.data || [],
    residents: residentsRes.data || [],
  }
}

export async function getFinanceOverview(propertyId: string | null) {
  if (!propertyId) {
    return {
      monthIncome: 0,
      monthExpenses: 0,
      pendingFinesAmount: 0,
      reserveBalance: 0,
      collectionRate: 0,
      healthLabel: 'Configurar propiedad',
      healthDescription: 'Asigna una propiedad al perfil para activar la lectura financiera.',
      recentMovements: [],
      overdueInvoices: [],
      activeUnits: 0,
      activeAccounts: 0,
      totalMonthlyFees: 0,
      monthlyTrend: [],
      categoryBreakdown: [],
    }
  }

  const supabase = createSupabaseAdminClient()
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().slice(0, 10)

  const [movementsMonthRes, recentMovementsRes, unitsRes, accountsRes, finesRes, invoicesRes, categoriesRes, trendRes] = await Promise.all([
    supabase
      .from('financial_movements')
      .select('*')
      .eq('property_id', propertyId)
      .gte('movement_date', monthStart)
      .lte('movement_date', monthEnd),
    supabase
      .from('financial_movements')
      .select('*')
      .eq('property_id', propertyId)
      .order('movement_date', { ascending: false })
      .limit(8),
    supabase
      .from('community_units')
      .select('id, unit_number, monthly_fee')
      .eq('property_id', propertyId)
      .eq('is_active', true),
    supabase
      .from('bank_accounts')
      .select('id, account_alias, current_balance')
      .eq('property_id', propertyId)
      .eq('is_active', true),
    supabase
      .from('fines')
      .select('*')
      .eq('property_id', propertyId)
      .in('status', ['unpaid', 'appealed']),
    supabase
      .from('invoices')
      .select('*')
      .eq('property_id', propertyId)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true })
      .limit(6),
    supabase
      .from('financial_categories')
      .select('id, name, type, icon')
      .or(`property_id.is.null,property_id.eq.${propertyId}`),
    supabase
      .from('financial_movements')
      .select('movement_date, amount, type, status, category_id')
      .eq('property_id', propertyId)
      .gte('movement_date', sixMonthsAgo)
      .order('movement_date', { ascending: true }),
  ])

  const movementsMonth = movementsMonthRes.data || []
  const recentMovements = recentMovementsRes.data || []
  const units = unitsRes.data || []
  const accounts = accountsRes.data || []
  const fines = finesRes.data || []
  const overdueInvoices = invoicesRes.data || []
  const categories = categoriesRes.data || []
  const trendMovements = trendRes.data || []

  const categoryMap = new Map(categories.map((category) => [category.id, category]))
  const unitMap = new Map(units.map((unit) => [unit.id, unit]))
  const accountMap = new Map(accounts.map((account) => [account.id, account]))

  const monthIncome = movementsMonth
    .filter((movement) => movement.type === 'income' && movement.status !== 'cancelled')
    .reduce((sum, movement) => sum + asNumber(movement.amount), 0)

  const monthExpenses = movementsMonth
    .filter((movement) => movement.type === 'expense' && movement.status !== 'cancelled')
    .reduce((sum, movement) => sum + asNumber(movement.amount), 0)

  const pendingFinesAmount = fines.reduce((sum, fine) => sum + asNumber(fine.amount), 0)

  const reserveBalance = accounts
    .filter((account) => /reserva|fondo/i.test(account.account_alias || ''))
    .reduce((sum, account) => sum + asNumber(account.current_balance), 0)

  const totalMonthlyFees = units.reduce((sum, unit) => sum + asNumber(unit.monthly_fee), 0)
  const confirmedQuotaIncome = movementsMonth
    .filter((movement) => {
      const category = categoryMap.get(movement.category_id)
      return movement.type === 'income' && ['confirmed', 'reconciled'].includes(movement.status) && /cuota de mantenimiento/i.test(category?.name || '')
    })
    .reduce((sum, movement) => sum + asNumber(movement.amount), 0)

  const collectionRate = totalMonthlyFees > 0 ? Math.min(100, Math.round((confirmedQuotaIncome / totalMonthlyFees) * 100)) : 0

  const pendingReconciliations = accounts.filter((account) => asNumber(account.current_balance) < 0).length
  const healthLabel = overdueInvoices.length > 0 || pendingReconciliations > 0 ? 'Atención' : 'Estable'
  const healthDescription = overdueInvoices.length > 0
    ? 'Hay facturas pendientes u observaciones que requieren seguimiento del administrador.'
    : 'Sin alertas críticas y con visibilidad suficiente para operar el cierre financiero.'

  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(date)
    const items = trendMovements.filter((movement) => String(movement.movement_date).startsWith(key) && movement.status !== 'cancelled')
    return {
      key,
      label,
      income: items.filter((movement) => movement.type === 'income').reduce((sum, movement) => sum + asNumber(movement.amount), 0),
      expense: items.filter((movement) => movement.type === 'expense').reduce((sum, movement) => sum + asNumber(movement.amount), 0),
    }
  })

  const categoryBreakdown = movementsMonth.reduce<Map<string, number>>((acc, movement) => {
    const category = categoryMap.get(movement.category_id)
    const key = category?.name || 'Sin categoría'
    const current = acc.get(key) || 0
    acc.set(key, current + asNumber(movement.amount))
    return acc
  }, new Map<string, number>())

  const categoryBreakdownList: Array<{ name: string; total: number }> = []
  for (const [name, total] of categoryBreakdown.entries()) {
    categoryBreakdownList.push({ name, total })
  }
  categoryBreakdownList.sort((left, right) => right.total - left.total)
  categoryBreakdownList.splice(6)

  return {
    monthIncome,
    monthExpenses,
    pendingFinesAmount,
    reserveBalance,
    collectionRate,
    healthLabel,
    healthDescription,
    activeUnits: units.length,
    activeAccounts: accounts.length,
    totalMonthlyFees,
    recentMovements: recentMovements.map((movement) => ({
      ...movement,
      category_name: categoryMap.get(movement.category_id)?.name || 'Sin categoría',
      unit_number: unitMap.get(movement.unit_id)?.unit_number || null,
      account_alias: accountMap.get(movement.bank_account_id)?.account_alias || null,
    })),
    overdueInvoices,
    monthlyTrend,
    categoryBreakdown: categoryBreakdownList,
  }
}
