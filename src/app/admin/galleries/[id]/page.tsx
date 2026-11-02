import { Suspense } from "react";
import { GalleryEditor } from "@/components/GalleryEditor";

export default async function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <GalleryEditor id={id} />
    </Suspense>
  );
}
