"use client";

import AdminLayout from "../components/layout/adminLayout";

export default function DashboardPage() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white p-5 rounded-xl shadow">
          <p>Ventas hoy</p>
          <h2 className="text-3xl font-bold">RD$12,500</h2>
          <span className="text-sm">+RD$3,500 hoy</span>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500">Pedidos</p>
          <h2 className="text-2xl font-bold">32</h2>
          <span className="text-green-500 text-sm">+12 hoy</span>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500">Estado</p>
          <h2 className="text-green-500 font-bold">Abierto</h2>
        </div>
      </div>

      {/* Pedidos recientes */}
      <div className="mt-10 grid grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="font-bold mb-4">Pedidos recientes</h2>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span>#123 - Pizza</span>
              <span className="text-orange-500">En preparación</span>
            </div>

            <div className="flex justify-between">
              <span>#124 - Hamburguesa</span>
              <span className="text-green-500">Listo</span>
            </div>

            <div className="flex justify-between">
              <span>#125 - Ensalada</span>
              <span className="text-orange-500">En preparación</span>
            </div>
          </div>
        </div>

        {/* Menú preview */}
        <div className="bg-white p-5 rounded-xl shadow">
          <div className="flex justify-between mb-4">
            <h2 className="font-bold">Menú</h2>

            <button className="bg-orange-500 text-white px-3 py-1 rounded">
              + Agregar
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Pizza Pepperoni</span>
              <span className="text-orange-500">RD$500</span>
            </div>

            <div className="flex justify-between">
              <span>Pizza Vegetariana</span>
              <span className="text-orange-500">RD$450</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
