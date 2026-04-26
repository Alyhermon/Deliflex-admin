import StoreDetailClient from "./store-details-client";

export default function StoreDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <StoreDetailClient id={params.id} />;
}