import { resetOrder, updateOrder, updateSelection } from "@/lib/api"
import { ITEMS_PER_PAGE } from "@/lib/const"
import type { FetchItemsResponse } from "@/lib/schema"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const useSelectionMutation = (searchQuery: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSelection,
    onMutate: async ({ selectedIds, unSelectedIds }) => {
      await queryClient.cancelQueries({ queryKey: ["listData", searchQuery] })

      const previousData = queryClient.getQueryData(["listData", searchQuery])

      // Optimistically update the UI
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(["listData", searchQuery], (oldData: any) => {
        if (!oldData) return oldData

        const selectedIdsSet = new Set(selectedIds)
        const unSelectedIdsSet = new Set(unSelectedIds);

        return {
          ...oldData,
          pages: oldData.pages.map((page: FetchItemsResponse) => ({
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
      toast.success("Selection updated", {
        description: `${data.selectedCount} items selected`,
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["listData"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}

export function useOrderMutation(searchQuery: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateOrder,
    onMutate: async ({ orderedItems }) => {
      await queryClient.cancelQueries({ queryKey: ["listData", searchQuery] })

      const previousData = queryClient.getQueryData(["listData", searchQuery])

      // Optimistically update the UI
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(["listData", searchQuery], (oldData: any) => {
        if (!oldData) return oldData

        // Create a map of id to new index
        const indexMap = new Map(orderedItems.map((item) => [item.id, item.index]))

        const allItems: FetchItemsResponse["items"] = oldData.pages.flatMap((page: FetchItemsResponse) => 
          page.items.map((item) => ({
            ...item,
            index: indexMap.get(item.id) ?? item.index,
          }))
        )
        allItems.sort((a, b) => a.index - b.index)

        const updatedPages = oldData.pages.map((page: FetchItemsResponse, pageIndex: number) => {
          const startIndex = pageIndex * ITEMS_PER_PAGE
          const endIndex = startIndex + ITEMS_PER_PAGE
          const pageItems = allItems.slice(startIndex, endIndex)
              
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
      toast.success("Order updated")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["listData", searchQuery] })
      queryClient.invalidateQueries({ queryKey: ["stats", searchQuery] })
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(["listData"], (oldData: any) => {
        if (!oldData) return oldData

        const updatedPages = oldData.pages.map((page: FetchItemsResponse) => ({
          ...page,
          items: page.items
            .map((item) => ({
              ...item,
              index: item.id - 1
            }))
            .sort((a, b) => a.index - b.index),
        }))

        return {
          ...oldData,
          pages: updatedPages,
        }
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
      queryClient.invalidateQueries({ queryKey: ["listData"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}