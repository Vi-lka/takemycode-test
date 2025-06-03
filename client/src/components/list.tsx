import { fetchItems } from '@/lib/api'
import { ITEMS_PER_PAGE } from '@/lib/const'
import { useDebounce } from '@/lib/use-debounce'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from "@tanstack/react-virtual"
import { Loader2 } from 'lucide-react'
import { Button } from './ui/button'

export default function List() {
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } = useInfiniteQuery({
    queryKey: ["listData", debouncedSearchQuery],
    queryFn: ({ pageParam = 1 }) =>
      fetchItems({
        page: pageParam,
        search: debouncedSearchQuery,
        limit: ITEMS_PER_PAGE,
        useCustomOrder: true,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.currentPage + 1 : undefined),
    initialPageParam: 1,
  })

  const allItems = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? []
  }, [data])

  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: allItems.length,
    // count: hasNextPage ? allItems.length + 1 : allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  })

  // Handle infinite scrolling
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse()

    if (!lastItem) return

    if (lastItem.index >= allItems.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNextPage, fetchNextPage, allItems.length, isFetchingNextPage, virtualizer.getVirtualItems()])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-red-500 p-4">
        <p>Error loading data. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  console.log(allItems)

  return (
    <div>list</div>
  )
}
