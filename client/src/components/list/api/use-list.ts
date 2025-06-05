import { useSearch } from "@/lib/useSearch"
import { useItemsStore } from "./store"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { fetchItems } from "@/lib/api"
import { ITEMS_PER_PAGE } from "@/lib/const"
import { useOrderMutation, useSelectionMutation } from "./mutations"
import { useVirtualizer } from "@tanstack/react-virtual"
import { arrayMove } from "@dnd-kit/sortable"

export default function useList() {
  const [searchQuery] = useSearch()
  const { localItems, setLocalItems } = useItemsStore()
  const parentRef = useRef<HTMLDivElement>(null)

  // Data fetching
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

  // Mutations
  const selectionMutation = useSelectionMutation(searchQuery)
  const orderMutation = useOrderMutation(searchQuery)

  const serverItems = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? []
  }, [data])

  // Sync local items with server items
  useEffect(() => {
    setLocalItems(serverItems)
  }, [serverItems, setLocalItems])

  // Virtualization
  const virtualizer = useVirtualizer({
    count: hasNextPage ? localItems.length + 1 : localItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 49,
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? element => element?.getBoundingClientRect().height
        : undefined,
    overscan: 2,
  })

  const virtualItems = useMemo(() => {
    return virtualizer.getVirtualItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [virtualizer.getVirtualItems()])

  // Handle infinite scroll
  useEffect(() => {
    const [lastItem] = [...virtualItems].reverse()

    if (!lastItem) return

    console.log("Items: ", serverItems.length)

    if ((lastItem.index >= serverItems.length - 1) && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage, serverItems.length, isFetchingNextPage, virtualItems])

  // Event handlers
  const handleSelect = useCallback((id: number, selected: boolean) => {
    const newSelection = selected ? [id] : [];
    const newUnselection = selected ? [] : [id];
    
    selectionMutation.mutate({ selectedIds: newSelection, unSelectedIds: newUnselection });
  }, [selectionMutation]);

  const handleMove = useCallback((event: { activeIndex: number; overIndex: number }) => {
    const { activeIndex, overIndex } = event

    const newItems = arrayMove(localItems, activeIndex, overIndex)
    setLocalItems(newItems)

    const movedItem = serverItems[activeIndex];
    const targetItem = serverItems[overIndex];
    const movedItemNewIndex = targetItem.index;
    
    const isMovingUp = activeIndex > overIndex;
    const startIdx = Math.min(activeIndex, overIndex);
    const endIdx = Math.max(activeIndex, overIndex);
    
    const orderedItems: { id: number; index: number }[] = [];
    const reorderedItems = [...serverItems];
    
    // Perform the move in the array for reference
    const [moved] = reorderedItems.splice(activeIndex, 1);
    reorderedItems.splice(overIndex, 0, moved);
    
    // Update indices for affected items based on their index field
    for (let i = startIdx; i <= endIdx; i++) {
      const item = reorderedItems[i];

      let newIndex: number;
    
      if (item.id === movedItem.id) {
        // moved item gets the target item's original index
        newIndex = movedItemNewIndex;
      } else if (isMovingUp) {
        // shift down
        newIndex = item.index + 1;
      } else {
        // shift up
        newIndex = item.index - 1;
      }
    
      orderedItems.push({
        id: item.id,
        index: newIndex,
      });
    }

    orderMutation.mutate({ orderedItems })
  }, [localItems, orderMutation, serverItems, setLocalItems])

  return {
    // State
    localItems,
    isLoading,
    error,
    isFetchingNextPage,
    
    // Refs
    parentRef,
    
    // Virtualization
    virtualizer,
    virtualItems,
    
    // Handlers
    handleSelect,
    handleMove,
    refetch,
  }
}
