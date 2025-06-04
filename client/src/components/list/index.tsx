import { fetchItems } from '@/lib/api'
import { ITEMS_PER_PAGE } from '@/lib/const'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { useVirtualizer } from "@tanstack/react-virtual"
import { GripVertical, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Sortable, SortableContent, SortableItem, SortableItemHandle, SortableOverlay } from '../ui/sortable'
import ListItem from './item'
import { cn } from '@/lib/utils'
import { useSearch } from '@/lib/useSearch'
import { ScrollArea } from '../ui/scroll-area'

export default function List({
  className
}: {
  className?: string
}) {
  const [searchQuery] = useSearch()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } = useInfiniteQuery({
    queryKey: ["listData", searchQuery],
    queryFn: ({ pageParam = 1 }) =>
      fetchItems({
        page: pageParam,
        search: searchQuery,
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
    count: hasNextPage ? allItems.length + 1 : allItems.length,
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

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {/* Virtual scrolling container */}
      <ScrollArea ref={parentRef} className="h-[calc(100vh-200px)]">
        <Sortable value={allItems} getItemValue={(item) => item.id} orientation="vertical">
          <SortableContent
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = allItems[virtualItem.index]
              if (!item) return null

              return (
                <SortableItem
                  key={virtualItem.index}
                  value={item.id}
                  style={{
                    position: "absolute",
                    top: virtualItem.start,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                  }}
                >
                  <ListItem 
                    item={item}
                    className={cn(
                      item.selected ? "bg-muted" : "",
                      'data-dragging:shadow-lg data-dragging:border-primary data-dragging:z-50'
                    )}
                  >
                    <SortableItemHandle className="mr-2 p-1 h-auto">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </SortableItemHandle>
                  </ListItem>
                </SortableItem>
              )
            })}
          </SortableContent>

          <SortableOverlay>
            {({ value }) => {
              const draggedItem = allItems.find((item) => item.id === value)
              return (
                <ListItem 
                  item={draggedItem ? draggedItem : {id: -1, value: "Dragging item...", selected: false}}
                  className="shadow-lg rounded opacity-90"
                >
                  <div className="mr-2 p-1 h-auto">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                </ListItem>
              )
            }}
          </SortableOverlay>
        </Sortable>

        {/* Loading indicator */}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading more items...</span>
          </div>
        )}
      </ScrollArea>
      {/* Stats */}
      {/* <div className="p-4 border-t bg-muted/50">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {allItems.length} items
            {debouncedSearchQuery && ` (filtered by "${debouncedSearchQuery}")`}
            {stats && ` • Total: ${stats.totalItems}`}
          </span>
          <div className="flex items-center gap-4">
            {stats?.hasCustomOrder && <span>Using custom order</span>}
            <span>{hasNextPage ? "Scroll for more" : "All items loaded"}</span>
          </div>
        </div>
      </div> */}
    </div>
  )
}
