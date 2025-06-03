import { cn } from '@/lib/utils'
import { ModeToggle } from './providers/mode-toggle'

export default function Header({
  className
}: {
  className?: string
}) {
  return (
    <header className={cn("fixed top-0 px-8 md:px-12 z-50 w-full border-b border-border/40 bg-background/10 backdrop-blur-xs", className)}>
      <div className="container flex h-12 items-center justify-between mx-auto">
        <div className=''></div>
        <ModeToggle className="cursor-pointer" />
      </div>
    </header>
  )
}
