import { updateOrder, updateSelection } from "@/lib/api"
import type { FetchItemsResponse } from "@/lib/schema"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const useSelectionMutation = (searchQuery: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateSelection,
    onMutate: async ({ selectedIds }) => {
      await queryClient.cancelQueries({ queryKey: ["listData", searchQuery] })

      const previousData = queryClient.getQueryData(["listData", searchQuery])

      // Optimistically update the UI
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queryClient.setQueryData(["listData", searchQuery], (oldData: any) => {
        if (!oldData) return oldData

        const selectedIdsSet = new Set(selectedIds)

        return {
          ...oldData,
          pages: oldData.pages.map((page: FetchItemsResponse) => ({
            ...page,
            items: page.items.map((item) => ({
              ...item,
              selected: selectedIdsSet.has(item.id),
            })),
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

        const updatedPages = oldData.pages.map((page: FetchItemsResponse) => ({
          ...page,
          items: page.items
            .map((item) => ({
              ...item,
              index: indexMap.get(item.id) ?? item.index,
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
        queryClient.setQueryData(["listData", searchQuery], context.previousData)
      }
      toast.error("Error updating order", {
        description: err instanceof Error ? err.message : "An unknown error occurred",
        duration: Infinity
      })
    },
    onSuccess: () => {
      toast.success("Order updated", {
        description: "Items have been reordered successfully",
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["listData"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })
}