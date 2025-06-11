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
  const prevSearchQuery = useRef(searchQuery)

  // Data fetching
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching, error, refetch } = useInfiniteQuery({
    queryKey: ["listData", searchQuery],
    queryFn: ({ pageParam = 1 }) =>
      fetchItems({
        page: pageParam,
        search: searchQuery,
        limit: ITEMS_PER_PAGE,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.currentPage + 1 : undefined),
    initialPageParam: 1,
  })

  // If the fetch is due to a new searchQuery
  const isSearching = useMemo(() => {
    const queryChanged = prevSearchQuery.current !== searchQuery
    prevSearchQuery.current = searchQuery

    return isFetching && queryChanged && !isFetchingNextPage
  }, [isFetching, searchQuery, isFetchingNextPage])

  // Mutations
  const selectionMutation = useSelectionMutation(searchQuery)
  const orderMutation = useOrderMutation(searchQuery)

  const serverItems = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? []
  }, [data])

  // Sync local items with server items
  useEffect(() => {
    if (!isSearching) setLocalItems(serverItems)
  }, [isSearching, serverItems, setLocalItems])

  // Virtualization
  const virtualizer = useVirtualizer({
    count: hasNextPage ? localItems.length + 1 : localItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 49,
    // This for dynamic height, but it consumes more resources.
    // measureElement:
    //   typeof window !== 'undefined' &&
    //   navigator.userAgent.indexOf('Firefox') === -1
    //     ? element => element?.getBoundingClientRect().height
    //     : undefined,
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

    const movedItem = localItems[activeIndex];
    const targetItem = localItems[overIndex];

    const newItems = arrayMove(localItems, activeIndex, overIndex)
    setLocalItems(newItems)

    const fromIndex = movedItem.reorderedIndex ?? movedItem.defaultIndex;
    const toIndex = targetItem.reorderedIndex ?? targetItem.defaultIndex;

    orderMutation.mutate({ fromIndex, toIndex, activeIndex, overIndex })
  }, [localItems, orderMutation, setLocalItems])

  return {
    // State
    localItems,
    isLoading,
    error,
    isFetchingNextPage,
    isSearching,
    
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
