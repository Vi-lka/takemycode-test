import { z } from "zod"
import { ITEMS_PER_PAGE } from "./const"

export const ItemSchema = z.object({
  id: z.number(),
  value: z.string(),
  selected: z.boolean(),
})

// Queries
export const FetchItemsParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(ITEMS_PER_PAGE),
  search: z.string().default(""),
  useCustomOrder: z.boolean().default(true),
})

export const UpdateSelectionParamsSchema = z.object({
  selectedIds: z.array(z.number()),
})

export const UpdateOrderParamsSchema = z.object({
  orderedIds: z.array(z.number()),
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

export const FetchSelectedItemsResponseSchema = z.object({
  selectedItems: z.array(ItemSchema),
  count: z.number().int().nonnegative(),
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
  selectedItems: z.number().int().nonnegative(),
  hasCustomOrder: z.boolean(),
  customOrderLength: z.number().int().nonnegative(),
})

export type Item = z.infer<typeof ItemSchema>
export type FetchItemsParams = z.infer<typeof FetchItemsParamsSchema>
export type FetchItemsResponse = z.infer<typeof FetchItemsResponseSchema>
export type UpdateSelectionParams = z.infer<typeof UpdateSelectionParamsSchema>
export type UpdateSelectionResponse = z.infer<typeof UpdateSelectionResponseSchema>
export type FetchSelectedItemsResponse = z.infer<typeof FetchSelectedItemsResponseSchema>
export type UpdateOrderParams = z.infer<typeof UpdateOrderParamsSchema>
export type UpdateOrderResponse = z.infer<typeof UpdateOrderResponseSchema>
export type ResetOrderResponse = z.infer<typeof ResetOrderResponseSchema>
export type StatsResponse = z.infer<typeof StatsResponseSchema>