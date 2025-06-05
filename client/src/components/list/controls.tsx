import { RotateCcw, Search } from 'lucide-react'
import { Input } from '../ui/input'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/lib/use-debounce'
import { useEffect, useState } from 'react'
import { useSearch } from '@/lib/useSearch'
import { useResetOrderMutation } from './api/mutations'
import { Button } from '../ui/button'
import { useItemsStore } from './api/store'

interface ListControlsProps {
  className?: string
}

export default function ListControls({ className }: ListControlsProps) {
  return (
    <div className={cn("p-4 space-y-4", className)}>
      <div className="flex gap-6 flex-wrap items-center justify-between">
        <SearchInput />
        <ResetButton />
      </div>
    </div>
  )
}

function SearchInput() {
  const [searchQuery, setSearchQuery] = useSearch()
  const [search, setSearch] = useState(searchQuery)
  const debouncedSearchQuery = useDebounce(search, 300)

  useEffect(() => {
    setSearchQuery(debouncedSearchQuery)
  }, [debouncedSearchQuery, setSearchQuery])

  return (
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 min-w-40"
        />
      </div>
  )
}

function ResetButton() {
  const resetOrder = useItemsStore((state) => state.resetOrder)

  const resetOrderMutation = useResetOrderMutation()
  
  const handleResetOrder = () => {
    resetOrderMutation.mutate()
    resetOrder()
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className='cursor-pointer'
      onClick={handleResetOrder} 
      disabled={resetOrderMutation.isPending}
    >
      <RotateCcw className={cn("h-4 w-4 mr-1", resetOrderMutation.isPending && "animate-spin direction-reverse")} />
      Reset Order
    </Button>
  )
}
