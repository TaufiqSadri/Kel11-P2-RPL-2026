import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

type SyncSuspendedOptions = {
  restoreCleared?: boolean
}

function todayDateOnly() {
  const jakartaOffsetMs = 7 * 60 * 60 * 1000
  return new Date(Date.now() + jakartaOffsetMs).toISOString().slice(0, 10)
}

function uniqueIds(ids: string[] | undefined) {
  return Array.from(new Set((ids ?? []).map((id) => id.trim()).filter(Boolean)))
}

async function getSuspendedPelangganIds(admin: AdminClient, pelangganIds?: string[]) {
  const scopedIds = uniqueIds(pelangganIds)

  let instalasiQuery = admin
    .from('tagihan_instalasi')
    .select('pelanggan_id')
    .neq('status_tagihan', 'lunas')

  let bulananQuery = admin
    .from('tagihan')
    .select('pelanggan_id')
    .neq('status_tagihan', 'lunas')
    .lt('jatuh_tempo', todayDateOnly())

  if (scopedIds.length > 0) {
    instalasiQuery = instalasiQuery.in('pelanggan_id', scopedIds)
    bulananQuery = bulananQuery.in('pelanggan_id', scopedIds)
  }

  const [{ data: instalasiRows, error: instalasiError }, { data: bulananRows, error: bulananError }] =
    await Promise.all([instalasiQuery, bulananQuery])

  if (instalasiError) throw new Error(instalasiError.message)
  if (bulananError) throw new Error(bulananError.message)

  return uniqueIds([
    ...(instalasiRows ?? []).map((row) => row.pelanggan_id as string),
    ...(bulananRows ?? []).map((row) => row.pelanggan_id as string),
  ])
}

export async function syncSuspendedPelangganStatuses(
  pelangganIds?: string[],
  options: SyncSuspendedOptions = {},
) {
  try {
    const admin = createAdminClient()
    const scopedIds = uniqueIds(pelangganIds)
    const suspendedIds = await getSuspendedPelangganIds(admin, scopedIds)
    const suspendedIdSet = new Set(suspendedIds)
    const restoreCleared = options.restoreCleared ?? false

    if (suspendedIds.length > 0) {
      let suspendQuery = admin
        .from('pelanggan')
        .update({ status_langganan: 'ditangguhkan' })
        .in('id', suspendedIds)
        .in('status_langganan', ['aktif', 'ditangguhkan'])

      if (scopedIds.length > 0) {
        suspendQuery = suspendQuery.in('id', scopedIds)
      }

      const { error } = await suspendQuery
      if (error) throw new Error(error.message)
    }

    if (!restoreCleared) return suspendedIds

    if (scopedIds.length > 0) {
      const restoreIds = scopedIds.filter((id) => !suspendedIdSet.has(id))
      if (restoreIds.length > 0) {
        const { error } = await admin
          .from('pelanggan')
          .update({ status_langganan: 'aktif' })
          .in('id', restoreIds)
          .eq('status_langganan', 'ditangguhkan')

        if (error) throw new Error(error.message)
      }
    } else {
      let restoreQuery = admin
        .from('pelanggan')
        .update({ status_langganan: 'aktif' })
        .eq('status_langganan', 'ditangguhkan')

      if (suspendedIds.length > 0) {
        restoreQuery = restoreQuery.not('id', 'in', `(${suspendedIds.join(',')})`)
      }

      const { error } = await restoreQuery
      if (error) throw new Error(error.message)
    }

    return suspendedIds
  } catch (error) {
    console.error('syncSuspendedPelangganStatuses error:', error)
    return []
  }
}
