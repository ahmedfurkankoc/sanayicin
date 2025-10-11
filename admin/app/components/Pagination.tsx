'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  itemName?: string
}

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemName = 'kayıt'
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-700">
          {totalCount > 0 ? (
            <>
              {startItem}-{endItem} arası gösteriliyor, toplam {totalCount} {itemName}
            </>
          ) : (
            `Toplam 0 ${itemName}`
          )}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sayfa boyutu:</span>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap overflow-x-auto max-w-full">
            <button
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[2.25rem]"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Önceki
            </button>
            {/* Always show page 1 and 2 if exist */}
            {[1, 2].filter((p) => p <= totalPages).map((p) => (
              <button
                key={p}
                className={`px-3 py-1 rounded text-sm min-w-[2.25rem] ${
                  p === currentPage
                    ? 'bg-[color:var(--yellow)] text-[color:var(--black)]'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            ))}

            {/* Ellipsis after 2 when jumping to later pages */}
            {totalPages > 3 && currentPage > 4 && (
              <span className="px-2 text-gray-500">...</span>
            )}

            {/* Window around current page (exclude 1,2 and last) */}
            {Array.from({ length: 3 }, (_, i) => currentPage - 1 + i)
              .filter((p) => p > 2 && p < totalPages)
              .map((p) => (
                <button
                  key={p}
                  className={`px-3 py-1 rounded text-sm min-w-[2.25rem] ${
                    p === currentPage
                      ? 'bg-[color:var(--yellow)] text-[color:var(--black)]'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </button>
              ))}

            {/* Ellipsis before last when far from end */}
            {totalPages > 3 && currentPage < totalPages - 3 && (
              <span className="px-2 text-gray-500">...</span>
            )}

            {/* Always show last page if > 2 */}
            {totalPages > 2 && (
              <button
                className={`px-3 py-1 rounded text-sm min-w-[2.25rem] ${
                  totalPages === currentPage
                    ? 'bg-[color:var(--yellow)] text-[color:var(--black)]'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </button>
            )}
            
            <button
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[2.25rem]"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Sonraki
            </button>
            
            {/* Go to last page button */}
            {currentPage < totalPages && (
              <button
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 min-w-[2.25rem]"
                onClick={() => onPageChange(totalPages)}
                title="Son sayfaya git"
              >
                Son »
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
