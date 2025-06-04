import type { Item } from '@/lib/schema'
import { cn } from '@/lib/utils'
import { memo } from 'react'

interface ListItemProps {
  item: Item
//   onSelect: (id: number, selected: boolean) => void
  className?: string,
  children?: React.ReactNode
}

const ListItem = memo(function ListItem({ 
  item, 
  className,
  children
}: ListItemProps) {
  return (
    <div className={cn(
      'flex items-center p-3 border-b bg-background',
      className
    )}>
      {children}

      {/* <Checkbox
        checked={item.selected}
        onCheckedChange={(checked) => onSelect(item.id, checked === true)}
        className="mr-4"
        id={`checkbox-${item.id}`}
      /> */}

      <label htmlFor={`checkbox-${item.id}`} className="flex-1 cursor-pointer">
        {item.value}
      </label>
    </div>
  )
});

export default ListItem;