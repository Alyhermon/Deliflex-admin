"use client";

type Props = {
  storeId?: string;
};



export default function StoreDetailPanel({ storeId }: Props) {
  if (!storeId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Selecciona un negocio
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">
        Store {storeId}
      </h2>
    </div>
  );
}