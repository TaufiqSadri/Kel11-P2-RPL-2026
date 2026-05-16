export function CustomerTableSkeleton() {
  return (
    <div className="rounded-2xl bg-white shadow-card overflow-hidden">
      <div className="hidden lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Pelanggan', 'Kontak', 'Paket', 'Status', 'Bergabung', 'Aksi'].map((h) => (
                <th
                  key={h}
                  className="px-6 pb-3 pt-5 text-left text-xs font-semibold uppercase tracking-wider text-gray-300"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 animate-pulse rounded-md bg-gray-100" />
                      <div className="h-2.5 w-20 animate-pulse rounded-md bg-gray-100" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-40 animate-pulse rounded-md bg-gray-100" />
                    <div className="h-2.5 w-24 animate-pulse rounded-md bg-gray-100" />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 animate-pulse rounded-md bg-gray-100" />
                    <div className="h-2.5 w-16 animate-pulse rounded-md bg-gray-100" />
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
                </td>
                <td className="px-4 py-4">
                  <div className="h-3.5 w-24 animate-pulse rounded-md bg-gray-100" />
                </td>
                <td className="px-6 py-4">
                  <div className="ml-auto h-8 w-8 animate-pulse rounded-lg bg-gray-100" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile skeleton */}
      <div className="divide-y divide-gray-50 lg:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-4">
            <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-36 animate-pulse rounded-md bg-gray-100" />
              <div className="h-2.5 w-48 animate-pulse rounded-md bg-gray-100" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CustomerStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-card">
          <div className="mb-3 flex items-start justify-between">
            <div className="h-2.5 w-24 animate-pulse rounded-md bg-gray-100" />
            <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-100" />
          </div>
          <div className="h-8 w-16 animate-pulse rounded-md bg-gray-100" />
          <div className="mt-1 h-2.5 w-28 animate-pulse rounded-md bg-gray-100" />
        </div>
      ))}
    </div>
  )
}
