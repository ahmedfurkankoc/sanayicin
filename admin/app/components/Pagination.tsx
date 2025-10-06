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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          {totalCount > 0 ? (
            <>
              {startItem}-{endItem} arası gösteriliyor, toplam {totalCount} {itemName}
            </>
          ) : (
            `Toplam 0 ${itemName}`
          )}
        </div>
        <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Önceki
            </button>
            
            {/* First page */}
            <button
              className={`px-3 py-1 rounded text-sm ${
                1 === currentPage
                  ? 'bg-[color:var(--yellow)] text-[color:var(--black)]'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            
            {/* Show ellipsis if current page is far from start */}
            {currentPage > 4 && (
              <span className="px-2 text-gray-500">...</span>
            )}
            
            {/* Show pages around current page */}
            {Array.from({ length: Math.min(3, totalPages - 2) }, (_, i) => {
              let pageNum: number
              if (currentPage <= 3) {
                pageNum = i + 2 // 2, 3, 4
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 3 + i // last 3 pages
              } else {
                pageNum = currentPage - 1 + i // current-1, current, current+1
              }
              
              // Don't show page 1 or last page here
              if (pageNum <= 1 || pageNum >= totalPages) return null
              
              return (
                <button
                  key={pageNum}
                  className={`px-3 py-1 rounded text-sm ${
                    pageNum === currentPage
                      ? 'bg-[color:var(--yellow)] text-[color:var(--black)]'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
            
            {/* Show ellipsis if current page is far from end */}
            {currentPage < totalPages - 3 && (
              <span className="px-2 text-gray-500">...</span>
            )}
            
            {/* Last page (if more than 1 page) */}
            {totalPages > 1 && (
              <button
                className={`px-3 py-1 rounded text-sm ${
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
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Sonraki
            </button>
            
            {/* Go to last page button */}
            {currentPage < totalPages && (
              <button
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
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
