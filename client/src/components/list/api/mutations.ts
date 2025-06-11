import { resetOrder, updateOrder, updateSelection } from "@/lib/api"
import { ITEMS_PER_PAGE } from "@/lib/const"
import type { FetchItemsResponse } from "@/lib/schema"
import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query"
import { toast } from "sonner"

export const useSelectionMutation = (searchQuery: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['selection'],
    mutationFn: updateSelection,
    onMutate: async ({ selectedIds, unSelectedIds }) => {
      await queryClient.cancelQueries({ queryKey: ["listData", searchQuery] })

      const previousData = queryClient.getQueryData(["listData", searchQuery])

      // Optimistically update the UI
      queryClient.setQueryData<InfiniteData<FetchItemsResponse>>(["listData", searchQuery], (oldData) => {
        if (!oldData) return oldData

        const selectedIdsSet = new Set(selectedIds)
        const unSelectedIdsSet = new Set(unSelectedIds);

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => {
              const isSelected = selectedIdsSet.has(item.id);
              const isUnselected = unSelectedIdsSet.has(item.id);
              const selectionStatus = isSelected ? true : isUnselected ? false : item.selected;

              return {
                ...item,
                selected: selectionStatus,
              };
            }),
          })),
        }
      })

      toast.loading("Updating...", { 
        id: `selection-loading`,
        duration: Infinity 
      })

      // Return a context object with the snapshotted value
      return { previousData }
    },
    onError: (err, _selectedIds, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["listData", searchQuery], context.previousData)
      }
      toast.error("Error updating selection", {
        description: err instanceof Error ? err.message : "An unknown error occurred",
      })
    },
    onSuccess: (data) => {
      if (queryClient.isMutating({ mutationKey: ['selection'] }) === 1) {
        toast.success("Selection updated", {
          description: `${data.selectedCount} items selected`,
        })
      }
    },
    onSettled: () => {
      // Preventing over-invalidation if concurrent optimistic updates (https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)
      if (queryClient.isMutating({ mutationKey: ['selection'] }) === 1) {
        toast.dismiss(`selection-loading`)
        queryClient.invalidateQueries({ queryKey: ["listData", searchQuery] })
        queryClient.invalidateQueries({ queryKey: ["stats"] })
      }
    },
  })
}

export function useOrderMutation(searchQuery: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['order'],
    mutationFn: updateOrder,
    onMutate: async ({ activeIndex, overIndex }) => {
      await queryClient.cancelQueries({ queryKey: ["listData", searchQuery] })

      const previousData = queryClient.getQueryData(["listData", searchQuery])

      // Optimistically update the UI
      queryClient.setQueryData<InfiniteData<FetchItemsResponse>>(["listData", searchQuery], (oldData) => {
        if (!oldData) return oldData

        const allItems = oldData.pages.flatMap(page => page.items)

        const movedItem = allItems[activeIndex];
        const targetItem = allItems[overIndex];

        const movedItemNewIndex = targetItem.reorderedIndex ?? targetItem.defaultIndex;;

        const isMovingUp = activeIndex > overIndex;
        const startIdx = Math.min(activeIndex, overIndex);
        const endIdx = Math.max(activeIndex, overIndex);

        const moves: { itemId: number; newIndex: number }[] = [];
        const reorderedItems = [...allItems];

        // Perform the move in the array for reference
        const [moved] = reorderedItems.splice(activeIndex, 1);
        reorderedItems.splice(overIndex, 0, moved);

        // Update indices for affected items based on their index
        for (let i = startIdx; i <= endIdx; i++) {
          const item = reorderedItems[i];
        
          const itemId = item.id;
          let newIndex: number;
        
          if (itemId === movedItem.id) {
            // moved item gets the target item's original index
            newIndex = movedItemNewIndex;
          } else if (isMovingUp) {
            // shift down
            newIndex = (item.reorderedIndex ?? item.defaultIndex) + 1;
          } else {
            // shift up
            newIndex = (item.reorderedIndex ?? item.defaultIndex) - 1;
          }
        
          moves.push({
            itemId,
            newIndex,
          });
        }

        // Create a map of id to new index
        const moveMap = new Map(moves.map((move) => [move.itemId, move.newIndex]))

        const newItems = oldData.pages.flatMap((page) => 
          page.items.map((item) => ({
            ...item,
            reorderedIndex: moveMap.get(item.id) ?? item.reorderedIndex,
          }))
        )
        newItems.sort((a, b) => (a.reorderedIndex ?? a.defaultIndex) - (b.reorderedIndex ?? b.defaultIndex))

        const updatedPages = oldData.pages.map((page, pageIndex) => {
          const startIndex = pageIndex * ITEMS_PER_PAGE
          const endIndex = startIndex + ITEMS_PER_PAGE
          const pageItems = newItems.slice(startIndex, endIndex)
              
          return {
            ...page,
            items: pageItems,
          }
        })
      
        return {
          ...oldData,
          pages: updatedPages,
        }
      })

      toast.loading("Updating...", { 
        id: `order-loading`,
        duration: Infinity 
      })

      // Return a context object with the snapshotted value
      return { previousData }
    },
    onError: (err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["listData", searchQuery], context.previousData)
      }
      toast.error("Error updating order", {
        description: err instanceof Error ? err.message : "An unknown error occurred",
      })
    },
    onSuccess: () => {
      if (queryClient.isMutating({ mutationKey: ['order'] }) === 1) {
        toast.success("Order updated")
      }
    },
    onSettled: () => {
      // Preventing over-invalidation if concurrent optimistic updates (https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)
      if (queryClient.isMutating({ mutationKey: ['order'] }) === 1) {
        toast.dismiss(`order-loading`)
        queryClient.invalidateQueries({ queryKey: ["listData", searchQuery] })
        queryClient.invalidateQueries({ queryKey: ["stats"] })
      }
    },
  })
}

export function useResetOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resetOrder,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["listData"] })

      const previousData = queryClient.getQueryData(["listData"])

      // Optimistically update the UI
      queryClient.setQueryData<InfiniteData<FetchItemsResponse>>(["listData"], (oldData) => {
        if (!oldData) return oldData

        const updatedPages = oldData.pages.map((page) => ({
          ...page,
          items: page.items
            .map((item) => ({
              ...item,
              reorderedIndex: null,
            }))
            .sort((a, b) => a.defaultIndex - b.defaultIndex)
        }))

        return {
          ...oldData,
          pages: updatedPages,
        }
      })

      toast.loading("Resetting order...", { 
        id: `reset-order-loading`,
        duration: Infinity 
      })

      // Return a context object with the snapshotted value
      return { previousData }
    },
    onError: (err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["listData"], context.previousData)
      }
      toast.error("Error resetting order", {
        description: err instanceof Error ? err.message : "An unknown error occurred",
      })
    },
    onSuccess: () => {
      toast.success("Order reset")
    },
    onSettled: () => {
      toast.dismiss(`reset-order-loading`)
      queryClient.invalidateQueries({ queryKey: ["listData"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}