import { Suspense } from "react";
import { GalleriesManager } from "@/components/GalleriesManager";

export default function GalleriesPage() {
  return (
    <Suspense>
      <GalleriesManager />
    </Suspense>
  );
}
