import { z } from "zod"
import { ITEMS_PER_PAGE } from "./const"

export const ItemSchema = z.object({
  id: z.number(),
  value: z.string(),
  selected: z.boolean(),
  defaultIndex: z.number(),
  reorderedIndex: z.number().nullable()
})

// Queries
export const FetchItemsParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(ITEMS_PER_PAGE),
  search: z.string().default(""),
})

export const UpdateSelectionParamsSchema = z.object({
  selectedIds: z.array(z.number()),
  unSelectedIds: z.array(z.number()),
})

export const UpdateOrderParamsSchema = z.object({
  fromIndex: z.number(),
  toIndex: z.number(),
  activeIndex: z.number(),
  overIndex: z.number()
})

// Responses
export const FetchItemsResponseSchema = z.object({
  items: z.array(ItemSchema),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  currentPage: z.number().int().positive(),
  hasMore: z.boolean(),
})

export const UpdateSelectionResponseSchema = z.object({
  success: z.boolean(),
  selectedCount: z.number().int().nonnegative(),
})

export const UpdateOrderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

export const ResetOrderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

export const StatsResponseSchema = z.object({
  totalItems: z.number().int().nonnegative(),
  selectedItems: z.array(ItemSchema),
  reorderedItems: z.array(ItemSchema),
  memoryUsage: z.object({
    rss: z.number(),
    heapTotal: z.number(),
    heapUsed: z.number(),
    external: z.number(),
    arrayBuffers: z.number()
  })
})

export type Item = z.infer<typeof ItemSchema>
export type FetchItemsParams = z.infer<typeof FetchItemsParamsSchema>
export type FetchItemsResponse = z.infer<typeof FetchItemsResponseSchema>
export type UpdateSelectionParams = z.infer<typeof UpdateSelectionParamsSchema>
export type UpdateSelectionResponse = z.infer<typeof UpdateSelectionResponseSchema>
export type UpdateOrderParams = z.infer<typeof UpdateOrderParamsSchema>
export type UpdateOrderResponse = z.infer<typeof UpdateOrderResponseSchema>
export type ResetOrderResponse = z.infer<typeof ResetOrderResponseSchema>
export type StatsResponse = z.infer<typeof StatsResponseSchema>