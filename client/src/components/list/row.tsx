import type { Item } from '@/lib/schema'
import type { VirtualItem } from '@tanstack/react-virtual'
import React, { memo } from 'react'
import { SortableItem, SortableItemHandle } from '../ui/sortable'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'
import ListItem from './item'

interface ListRowProps {
  item: Item
  virtualItem: VirtualItem
  onSelect: (id: number, selected: boolean) => void
  style?: React.CSSProperties
}

const ListRow = memo(({ 
  item, 
  virtualItem, 
  onSelect, 
  style 
}: ListRowProps) => {
  return (
    <SortableItem
      data-index={virtualItem.index}
      value={item.id}
      style={style}
    >
      <ListItem 
        item={item}
        onSelect={onSelect}
        className={cn(item.selected ? "bg-muted" : "")}
      >
        <SortableItemHandle className="mr-2 p-1 h-auto">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </SortableItemHandle>
      </ListItem>
    </SortableItem>
  )
})

export default ListRow
