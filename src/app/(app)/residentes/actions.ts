'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getResidentsSession } from './lib'

const ALLOWED_UNIT_TYPES = ['apartment', 'house', 'local', 'parking', 'storage']

export async function createCommunityUnit(formData: FormData) {
  const { propertyId } = await getResidentsSession(true)

  if (!propertyId) redirect('/residentes/unidades?error=missing-property')

  const supabase = createSupabaseAdminClient()
  const unitNumber = String(formData.get('unit_number') || '').trim()
  const unitType = String(formData.get('unit_type') || 'apartment').trim()
  const floorRaw = String(formData.get('floor') || '').trim()
  const areaSqmRaw = String(formData.get('area_sqm') || '').trim()
  const monthlyFeeRaw = String(formData.get('monthly_fee') || '').trim()
  const notes = String(formData.get('notes') || '').trim() || null

  if (!unitNumber || !ALLOWED_UNIT_TYPES.includes(unitType)) {
    redirect('/residentes/unidades?error=validation')
  }

  const payload = {
    property_id: propertyId,
    unit_number: unitNumber,
    unit_type: unitType,
    floor: floorRaw ? Number(floorRaw) : null,
    area_sqm: areaSqmRaw ? Number(areaSqmRaw) : null,
    monthly_fee: monthlyFeeRaw ? Number(monthlyFeeRaw) : 0,
    notes,
    is_active: true,
  }

  const { error } = await supabase.from('community_units').insert(payload)

  if (error) {
    redirect('/residentes/unidades?error=duplicate')
  }

  revalidatePath('/residentes')
  revalidatePath('/residentes/unidades')
  revalidatePath('/finanzas')
  redirect('/residentes/unidades?created=1')
}

export async function createResidentAccount(formData: FormData) {
  const { propertyId } = await getResidentsSession(true)

  if (!propertyId) redirect('/residentes/nuevo?error=missing-property')

  const supabase = createSupabaseAdminClient()
  const fullName = String(formData.get('full_name') || '').trim()
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const unitId = String(formData.get('unit_id') || '').trim()
  const phone = String(formData.get('phone') || '').trim() || null
  const emergencyContact = String(formData.get('emergency_contact') || '').trim() || null
  const residentSince = String(formData.get('resident_since') || '').trim() || null
  const residentType = String(formData.get('resident_type') || 'owner').trim()
  const vehiclePlatesRaw = String(formData.get('vehicle_plates') || '').trim()
  const vehiclePlates = vehiclePlatesRaw
    ? vehiclePlatesRaw.split(/\r?\n|,/).map((item) => item.trim().toUpperCase()).filter(Boolean)
    : []

  if (!fullName || !email || !unitId) {
    redirect('/residentes/nuevo?error=validation')
  }

  const { data: unit } = await supabase
    .from('community_units')
    .select('id, unit_number')
    .eq('id', unitId)
    .eq('property_id', propertyId)
    .single()

  if (!unit) {
    redirect('/residentes/nuevo?error=unit')
  }

  const invited = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  })

  if (invited.error || !invited.data.user) {
    redirect('/residentes/nuevo?error=user')
  }

  const newUserId = invited.data.user.id

  const profilePayload = {
    id: newUserId,
    role: 'resident',
    full_name: fullName,
    phone,
    property_id: propertyId,
    location_id: propertyId,
    unit_number: unit.unit_number,
    resident_since: residentSince,
    emergency_contact: emergencyContact,
    vehicle_plates: vehiclePlates,
    is_owner: residentType === 'owner',
  }

  const { error: profileError } = await supabase.from('profiles').upsert(profilePayload)

  if (profileError) {
    redirect('/residentes/nuevo?error=profile')
  }

  await supabase.from('user_locations').delete().eq('user_id', newUserId)
  await supabase.from('user_locations').insert({ user_id: newUserId, location_id: propertyId })

  revalidatePath('/residentes')
  revalidatePath('/residentes/directorio')
  revalidatePath('/residentes/vehiculos')
  revalidatePath('/residentes/unidades')
  revalidatePath('/finanzas')
  redirect('/residentes/directorio?created=1')
}
