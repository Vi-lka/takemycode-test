import { memo, useMemo } from 'react'
import { GripVertical, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Sortable, SortableContent, SortableOverlay } from '../ui/sortable'
import ListItem from './item'
import { cn } from '@/lib/utils'
import { ScrollArea } from '../ui/scroll-area'
import ListRow from './row'
import type { Item } from '@/lib/schema'
import useList from './api/use-list'

export default function List({
  className
}: {
  className?: string
}) {
 const {
    localItems,
    isLoading,
    error,
    isFetchingNextPage,
    parentRef,
    virtualizer,
    virtualItems,
    handleSelect,
    handleMove,
    refetch,
  } = useList()

  const virtualContent = useMemo(() => {
    return virtualItems.map((virtualItem) => {
      const item = localItems[virtualItem.index]
      if (!item) return null

      const itemStyle = {
        position: "absolute" as const,
        top: virtualItem.start,
        left: 0,
        width: "100%",
      }

      return (
        <ListRow
          key={item.id}
          item={item}
          virtualItem={virtualItem}
          onSelect={handleSelect}
          style={itemStyle}
        />
      )
    })
  }, [virtualItems, localItems, handleSelect])

  if (isLoading) {
    return <LoadingState className={className} />
  }

  if (error) {
    return <ErrorState className={className} onRetry={refetch} />
  }

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      {/* Virtual scrolling container */}
      <ScrollArea ref={parentRef} className="h-[calc(100vh-260px)]">
        <Sortable 
          value={localItems} 
          getItemValue={(item) => item.id} 
          onMove={handleMove} 
          orientation="vertical"
        >
          <SortableContent
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
              willChange: "transform",
            }}
          >
            {virtualContent}
          </SortableContent>

          <SortableOverlay>
            {({ value }) => {
              const draggedItem = localItems.find((item) => item.id === value) || {
                id: -1,
                value: "Dragging item...",
                index: -1,
                selected: false,
              }
              return <DragOverlayItem item={draggedItem} />
            }}
          </SortableOverlay>
        </Sortable>

        {isFetchingNextPage && <LoadingMoreIndicator />}
      </ScrollArea>
    </div>
  )
}

const DragOverlayItem = memo(({ item }: { item: Item }) => (
  <ListItem item={item} className={cn(item.selected ? "bg-muted" : "", "shadow-lg rounded opacity-90")}>
    <div className="mr-2 p-1 h-auto">
      <GripVertical className="h-5 w-5 text-muted-foreground" />
    </div>
  </ListItem>
))

const LoadingState = memo(({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center h-[calc(100vh-260px)]", className)}>
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Loading data...</span>
  </div>
))

const ErrorState = memo(({ className, onRetry }: { className?: string; onRetry: () => void }) => (
  <div className={cn("flex flex-col items-center justify-center h-[calc(100vh-260px)] text-center text-destructive p-4", className)}>
    <p>Error loading data. Please try again.</p>
    <Button onClick={onRetry} className="mt-2 cursor-pointer">
      Retry
    </Button>
  </div>
))

const LoadingMoreIndicator = memo(() => (
  <div className="flex items-center justify-center p-2">
    <Loader2 className="h-6 w-6 animate-spin mr-2" />
    <span>Loading more items...</span>
  </div>
))