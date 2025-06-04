import { Search } from 'lucide-react'
import { Input } from '../ui/input'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/lib/use-debounce'
import { useEffect, useState } from 'react'
import { useSearch } from '@/lib/useSearch'

interface ListControlsProps {
  className?: string
}

export default function ListControls({ className }: ListControlsProps) {
  const [searchQuery, setSearchQuery] = useSearch()

  const [search, setSearch] = useState(searchQuery)
  const debouncedSearchQuery = useDebounce(search, 300)

  useEffect(() => {
    setSearchQuery(debouncedSearchQuery)
  }, [debouncedSearchQuery, setSearchQuery])
  

  return (
    <div className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {/* <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
            {stats && ` of ${stats.totalItems} total`}
          </span>
          <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={selectionMutation.isPending}>
            {allItems.every((item) => item.selected) ? "Deselect All" : "Select All"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetOrder} disabled={resetOrderMutation.isPending}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset Order
          </Button>
        </div> */}
      </div>
    </div>
  )
}
