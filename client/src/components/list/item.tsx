import type { Item } from '@/lib/schema'
import { cn } from '@/lib/utils'
import { memo } from 'react'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'

interface ListItemProps {
  item: Item
  onSelect?: (id: number, selected: boolean) => void
  className?: string,
  disabled?: boolean
  children?: React.ReactNode
}

const ListItem = memo(({ 
  item, 
  onSelect,
  className,
  disabled,
  children
}: ListItemProps) => {
  return (
    <div className={cn(
      'flex items-center border-b px-3 bg-background',
      className
    )}>
      {children}

      <Checkbox
        id={`checkbox-${item.id}`}
        checked={item.selected}
        disabled={disabled}
        onCheckedChange={(checked) => onSelect?.(item.id, checked === true)}
        className="mr-4 cursor-pointer"
      />

      <Label htmlFor={`checkbox-${item.id}`} className="text-base flex-1 p-3 cursor-pointer">
        {item.value}
      </Label>
    </div>
  )
})

export default ListItem;