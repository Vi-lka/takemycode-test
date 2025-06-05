import type { Item } from '@/lib/schema'
import React, { memo } from 'react'
import { SortableItem, SortableItemHandle } from '../ui/sortable'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'
import ListItem from './item'

interface ListRowProps {
  item: Item
  // virtualizer: Virtualizer<HTMLDivElement, Element>
  // virtualItem: VirtualItem
  onSelect: (id: number, selected: boolean) => void
  disabled?: boolean
  style?: React.CSSProperties
}

const ListRow = memo(({ 
  item, 
  // virtualizer,
  // virtualItem, 
  onSelect, 
  disabled,
  style 
}: ListRowProps) => {
  return (
    <SortableItem
      // This for dynamic height, but it consumes more resources.
      // data-index={virtualItem.index}
      // ref={node => virtualizer.measureElement(node)} 
      value={item.id}
      disabled={disabled}
      style={style}
    >
      <ListItem 
        item={item}
        disabled={disabled}
        onSelect={onSelect}
        className={cn(item.selected ? "bg-muted" : "")}
      >
        <SortableItemHandle disabled={disabled} className="mr-2 p-1 h-auto">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </SortableItemHandle>
      </ListItem>
    </SortableItem>
  )
})

export default ListRow
