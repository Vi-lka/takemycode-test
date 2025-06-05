import { fetchStats } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'

export default function ListStats({
  className
}: {
  className?: string
}) {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 5000, // Refresh stats every 5 seconds
  })

  if (isLoading) return null;

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center text-center text-red-500 p-4", className)}>
        <p>Error loading stats. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("pt-4", className)}>
      <div className="p-4 border-t bg-muted/50">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {stats && ` • Total: ${stats.totalItems}`}
          </span>
        </div>
      </div> 
    </div>
  )
}
