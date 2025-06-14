import type z from "zod";
import { FetchItemsParamsSchema, FetchItemsResponseSchema, ResetOrderResponseSchema, StatsResponseSchema, UpdateOrderParamsSchema, UpdateOrderResponseSchema, UpdateSelectionParamsSchema, UpdateSelectionResponseSchema, type FetchItemsParams, type UpdateOrderParams, type UpdateSelectionParams } from "./schema";

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
const API_KEY = import.meta.env.VITE_API_KEY || 'your-secret-api-key';

async function apiRequest<TResponse, TParams = void>(
  url: string,
  options: RequestInit = {},
  responseSchema: z.ZodType<TResponse>,
  params?: TParams,
  paramsSchema?: z.ZodType<TParams>,
): Promise<TResponse> {
  try {
    if (params && paramsSchema) {
      params = paramsSchema.parse(params)
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `API request failed with status ${response.status}`)
    }

    const data = await response.json()

    try {
      return responseSchema.parse(data)
    } catch (validationError) {
      console.error("API response validation failed:", validationError)
      throw new Error("Invalid API response format")
    }
  } catch (error) {
    console.error(`API request to ${url} failed:`, error)
    throw error
  }
}

export async function fetchItems(params: FetchItemsParams) {
  const validParams = FetchItemsParamsSchema.parse(params)

  const queryParams = new URLSearchParams({
    page: validParams.page.toString(),
    limit: validParams.limit.toString(),
    search: validParams.search,
  })

  return apiRequest(
    `${API_BASE}/api/items?${queryParams}`, 
    { method: "GET" }, 
    FetchItemsResponseSchema
  )
}

export async function fetchStats() {
  return apiRequest(`${API_BASE}/api/stats`, { method: "GET" }, StatsResponseSchema)
}

export async function updateSelection(params: UpdateSelectionParams) {
  return apiRequest(
    `${API_BASE}/api/items/selection`,
    {
      method: "PATCH",
      body: JSON.stringify(params),
    },
    UpdateSelectionResponseSchema,
    params,
    UpdateSelectionParamsSchema,
  )
}

export async function updateOrder(params: UpdateOrderParams) {
  return apiRequest(
    `${API_BASE}/api/items/order`,
    {
      method: "PATCH",
      body: JSON.stringify(params),
    },
    UpdateOrderResponseSchema,
    params,
    UpdateOrderParamsSchema,
  )
}

export async function resetOrder() {
  return apiRequest(`${API_BASE}/api/items/order/reset`, { method: "PATCH" }, ResetOrderResponseSchema)
}