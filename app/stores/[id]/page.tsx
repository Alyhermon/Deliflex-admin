import StoreDetailClient from "./store-details-client";

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <StoreDetailClient id={id} />;
}