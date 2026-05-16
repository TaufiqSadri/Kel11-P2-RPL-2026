import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

type SyncSuspendedOptions = {
  restoreCleared?: boolean
}

function todayDateOnly() {
  const jakartaOffsetMs = 7 * 60 * 60 * 1000
  return new Date(Date.now() + jakartaOffsetMs).toISOString().slice(0, 10)
}

function dateOnlyDaysAgo(days: number) {
  const jakartaOffsetMs = 7 * 60 * 60 * 1000
  const date = new Date(Date.now() + jakartaOffsetMs)
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

function uniqueIds(ids: string[] | undefined) {
  return Array.from(new Set((ids ?? []).map((id) => id.trim()).filter(Boolean)))
}

async function getStatusBlockerPelangganIds(admin: AdminClient, pelangganIds?: string[]) {
  const scopedIds = uniqueIds(pelangganIds)
  const today = todayDateOnly()
  const thirtyDaysAgo = dateOnlyDaysAgo(30)

  let instalasiSuspendedQuery = admin
    .from('tagihan_instalasi')
    .select('pelanggan_id')
    .neq('status_tagihan', 'lunas')
    .gte('jatuh_tempo', thirtyDaysAgo)

  let instalasiInactiveQuery = admin
    .from('tagihan_instalasi')
    .select('pelanggan_id')
    .neq('status_tagihan', 'lunas')
    .lt('jatuh_tempo', thirtyDaysAgo)

  let bulananSuspendedQuery = admin
    .from('tagihan')
    .select('pelanggan_id')
    .neq('status_tagihan', 'lunas')
    .lt('jatuh_tempo', today)
    .gte('jatuh_tempo', thirtyDaysAgo)

  let bulananInactiveQuery = admin
    .from('tagihan')
    .select('pelanggan_id')
    .neq('status_tagihan', 'lunas')
    .lt('jatuh_tempo', thirtyDaysAgo)

  if (scopedIds.length > 0) {
    instalasiSuspendedQuery = instalasiSuspendedQuery.in('pelanggan_id', scopedIds)
    instalasiInactiveQuery = instalasiInactiveQuery.in('pelanggan_id', scopedIds)
    bulananSuspendedQuery = bulananSuspendedQuery.in('pelanggan_id', scopedIds)
    bulananInactiveQuery = bulananInactiveQuery.in('pelanggan_id', scopedIds)
  }

  const [
    { data: instalasiSuspendedRows, error: instalasiSuspendedError },
    { data: instalasiInactiveRows, error: instalasiInactiveError },
    { data: bulananSuspendedRows, error: bulananSuspendedError },
    { data: bulananInactiveRows, error: bulananInactiveError },
  ] = await Promise.all([
    instalasiSuspendedQuery,
    instalasiInactiveQuery,
    bulananSuspendedQuery,
    bulananInactiveQuery,
  ])

  if (instalasiSuspendedError) throw new Error(instalasiSuspendedError.message)
  if (instalasiInactiveError) throw new Error(instalasiInactiveError.message)
  if (bulananSuspendedError) throw new Error(bulananSuspendedError.message)
  if (bulananInactiveError) throw new Error(bulananInactiveError.message)

  const inactiveIds = uniqueIds([
    ...(instalasiInactiveRows ?? []).map((row) => row.pelanggan_id as string),
    ...(bulananInactiveRows ?? []).map((row) => row.pelanggan_id as string),
  ])
  const inactiveIdSet = new Set(inactiveIds)
  const suspendedIds = uniqueIds([
    ...(instalasiSuspendedRows ?? []).map((row) => row.pelanggan_id as string),
    ...(bulananSuspendedRows ?? []).map((row) => row.pelanggan_id as string),
  ]).filter((id) => !inactiveIdSet.has(id))

  return { suspendedIds, inactiveIds }
}

export async function syncSuspendedPelangganStatuses(
  pelangganIds?: string[],
  options: SyncSuspendedOptions = {},
) {
  try {
    const admin = createAdminClient()
    const scopedIds = uniqueIds(pelangganIds)
    const { suspendedIds, inactiveIds } = await getStatusBlockerPelangganIds(admin, scopedIds)
    const suspendedIdSet = new Set(suspendedIds)
    const restoreCleared = options.restoreCleared ?? false

    if (inactiveIds.length > 0) {
      let inactiveQuery = admin
        .from('pelanggan')
        .update({ status_langganan: 'nonaktif' })
        .in('id', inactiveIds)
        .in('status_langganan', ['aktif', 'ditangguhkan', 'proses_instalasi'])

      if (scopedIds.length > 0) {
        inactiveQuery = inactiveQuery.in('id', scopedIds)
      }

      const { error } = await inactiveQuery
      if (error) throw new Error(error.message)
    }

    if (suspendedIds.length > 0) {
      let suspendQuery = admin
        .from('pelanggan')
        .update({ status_langganan: 'ditangguhkan' })
        .in('id', suspendedIds)
        .in('status_langganan', ['aktif', 'ditangguhkan', 'proses_instalasi'])

      if (scopedIds.length > 0) {
        suspendQuery = suspendQuery.in('id', scopedIds)
      }

      const { error } = await suspendQuery
      if (error) throw new Error(error.message)
    }

    if (!restoreCleared) return suspendedIds

    if (scopedIds.length > 0) {
      const inactiveIdSet = new Set(inactiveIds)
      const restoreIds = scopedIds.filter((id) => !suspendedIdSet.has(id) && !inactiveIdSet.has(id))
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
      if (inactiveIds.length > 0) {
        restoreQuery = restoreQuery.not('id', 'in', `(${inactiveIds.join(',')})`)
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
