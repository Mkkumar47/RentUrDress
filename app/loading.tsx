import { LoadingScene } from "@/components/ui/loading-scene";

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center">
      <LoadingScene />
    </div>
  );
}
