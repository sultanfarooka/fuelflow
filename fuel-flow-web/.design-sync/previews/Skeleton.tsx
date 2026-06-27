import { Skeleton } from 'fuel-flow-web';

export const LoadingCard = () => (
  <div className="max-w-sm p-4">
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <div className="mt-4 flex flex-col gap-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/6" />
    </div>
  </div>
);

export const TableRows = () => (
  <div className="flex max-w-md flex-col gap-2 p-4">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
);
