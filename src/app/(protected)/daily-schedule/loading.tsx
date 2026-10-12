import { Skeleton } from "@/components/ui/skeleton";

export default function DailyScheduleLoading() {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <Skeleton className="h-16 w-full rounded-none" />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="overflow-hidden rounded-none border">
          <Skeleton className="h-10 w-full rounded-none" />
          <div className="space-y-px">
            <Skeleton className="h-28 w-full rounded-none" />
            <Skeleton className="h-28 w-full rounded-none" />
            <Skeleton className="h-28 w-full rounded-none" />
          </div>
        </div>

        <Skeleton className="hidden h-[32rem] rounded-none xl:block" />
      </div>
    </div>
  );
}
