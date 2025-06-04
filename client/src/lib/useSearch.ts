import { parseAsString, useQueryState } from 'nuqs'
 
export function useSearch() {
  return useQueryState('search', parseAsString.withDefault(""))
}