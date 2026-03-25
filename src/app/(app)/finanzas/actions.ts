'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getFinanceSession } from './lib'

export async function createFinancialMovement(formData: FormData) {
  const { isManager, profile, propertyId } = await getFinanceSession(true)

  if (!isManager || !propertyId) {
    redirect('/finanzas')
  }

  const supabase = createSupabaseAdminClient()
  const categoryId = String(formData.get('category_id') || '')
  const amount = Number(formData.get('amount') || 0)
  const description = String(formData.get('description') || '').trim()
  const movementDate = String(formData.get('movement_date') || '') || new Date().toISOString().slice(0, 10)
  const status = String(formData.get('status') || 'pending')
  const reference = String(formData.get('reference') || '').trim() || null
  const bankAccountId = String(formData.get('bank_account_id') || '').trim() || null
  const unitId = String(formData.get('unit_id') || '').trim() || null
  const residentId = String(formData.get('resident_id') || '').trim() || null
  const dueDate = String(formData.get('due_date') || '').trim() || null
  const notes = String(formData.get('notes') || '').trim() || null

  if (!categoryId || !description || !Number.isFinite(amount) || amount <= 0) {
    redirect('/finanzas/movimientos/nuevo?error=1')
  }

  const { data: category } = await supabase
    .from('financial_categories')
    .select('id, type, property_id')
    .eq('id', categoryId)
    .single()

  if (!category || (category.property_id && category.property_id !== propertyId)) {
    redirect('/finanzas/movimientos/nuevo?error=2')
  }

  const payload = {
    property_id: propertyId,
    category_id: category.id,
    bank_account_id: bankAccountId,
    unit_id: unitId,
    resident_id: residentId,
    type: category.type,
    amount,
    description,
    reference,
    movement_date: movementDate,
    due_date: dueDate,
    paid_date: ['confirmed', 'reconciled'].includes(status) ? movementDate : null,
    status,
    notes,
    created_by: profile.id,
  }

  const { error } = await supabase.from('financial_movements').insert(payload)

  if (error) {
    redirect('/finanzas/movimientos/nuevo?error=3')
  }

  if (bankAccountId && ['confirmed', 'reconciled'].includes(status)) {
    const { data: account } = await supabase
      .from('bank_accounts')
      .select('id, current_balance')
      .eq('id', bankAccountId)
      .eq('property_id', propertyId)
      .single()

    if (account) {
      const currentBalance = Number(account.current_balance || 0)
      const nextBalance = category.type === 'income' ? currentBalance + amount : currentBalance - amount
      await supabase.from('bank_accounts').update({ current_balance: nextBalance }).eq('id', account.id)
    }
  }

  revalidatePath('/finanzas')
  revalidatePath('/finanzas/movimientos')
  revalidatePath('/finanzas/reportes')
  redirect('/finanzas/movimientos?created=1')
}