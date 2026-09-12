"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type DaySchedule = {
  dayOfWeek: number; // 0=Domingo ... 6=Sabado (igual que la BD)
  label: string;
  openTime: string; // formato "H:MM AM/PM" (el que usa TimePicker)
  closeTime: string;
  isClosed: boolean;
};

const DIAS_INICIALES: DaySchedule[] = [
  { dayOfWeek: 1, label: "Lunes", openTime: "9:00 AM", closeTime: "6:00 PM", isClosed: false },
  { dayOfWeek: 2, label: "Martes", openTime: "9:00 AM", closeTime: "6:00 PM", isClosed: false },
  { dayOfWeek: 3, label: "Miércoles", openTime: "9:00 AM", closeTime: "6:00 PM", isClosed: false },
  { dayOfWeek: 4, label: "Jueves", openTime: "9:00 AM", closeTime: "6:00 PM", isClosed: false },
  { dayOfWeek: 5, label: "Viernes", openTime: "9:00 AM", closeTime: "6:00 PM", isClosed: false },
  { dayOfWeek: 6, label: "Sábado", openTime: "9:00 AM", closeTime: "6:00 PM", isClosed: false },
  { dayOfWeek: 0, label: "Domingo", openTime: "9:00 AM", closeTime: "6:00 PM", isClosed: true },
];

export type SellOptions = {
  delivery: boolean;
  pickup: boolean;
  dineIn: boolean;
};

export type PaymentOptions = {
  cash: boolean;
  card: boolean;
  transfer: boolean;
  app: boolean;
};

export type BusinessDocument = {
  documentType: string;
  documentUrl: string;
  fileName: string;
};

export type RegisterBusinessForm = {
  // Informacion
  nameBusisness: string;
  ownerFirstName: string;
  ownerLastName: string;
  categoryId: string;
  categoryLabel: string;
  taxId: string;
  email: string;
  phoneBusiness: string;
  storePhone: string;
  storeAddress: string;
  description: string;
  isStreetLocation: boolean;
  latitude: number | null;
  longitude: number | null;

  // Horarios
  sameHoursAllDays: boolean;
  genericOpenTime: string;
  genericCloseTime: string;
  schedules: DaySchedule[];

  // Servicios (todavia sin columna en la BD - se guarda por si se agrega mas adelante)
  sellOptions: SellOptions;
  payments: PaymentOptions;

  // Documentos
  documents: BusinessDocument[];
};

const FORM_INICIAL: RegisterBusinessForm = {
  nameBusisness: "",
  ownerFirstName: "",
  ownerLastName: "",
  categoryId: "",
  categoryLabel: "",
  taxId: "",
  email: "",
  phoneBusiness: "",
  storePhone: "",
  storeAddress: "",
  description: "",
  isStreetLocation: false,
  latitude: null,
  longitude: null,

  sameHoursAllDays: true,
  genericOpenTime: "9:00 AM",
  genericCloseTime: "6:00 PM",
  schedules: DIAS_INICIALES,

  sellOptions: { delivery: true, pickup: true, dineIn: false },
  payments: { cash: true, card: true, transfer: true, app: false },

  documents: [],
};

type ContextValue = {
  form: RegisterBusinessForm;
  update: (patch: Partial<RegisterBusinessForm>) => void;
  updateSchedule: (dayOfWeek: number, patch: Partial<DaySchedule>) => void;
  applyGenericHoursToAllDays: (openTime: string, closeTime: string) => void;
};

const RegisterBusinessContext = createContext<ContextValue | null>(null);

export function RegisterBusinessProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<RegisterBusinessForm>(FORM_INICIAL);

  const update = (patch: Partial<RegisterBusinessForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const updateSchedule = (dayOfWeek: number, patch: Partial<DaySchedule>) => {
    setForm((prev) => ({
      ...prev,
      schedules: prev.schedules.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d,
      ),
    }));
  };

  const applyGenericHoursToAllDays = (openTime: string, closeTime: string) => {
    setForm((prev) => ({
      ...prev,
      genericOpenTime: openTime,
      genericCloseTime: closeTime,
      schedules: prev.schedules.map((d) =>
        d.isClosed ? d : { ...d, openTime, closeTime },
      ),
    }));
  };

  return (
    <RegisterBusinessContext.Provider
      value={{ form, update, updateSchedule, applyGenericHoursToAllDays }}
    >
      {children}
    </RegisterBusinessContext.Provider>
  );
}

export function useRegisterBusiness() {
  const ctx = useContext(RegisterBusinessContext);
  if (!ctx) {
    throw new Error(
      "useRegisterBusiness debe usarse dentro de RegisterBusinessProvider",
    );
  }
  return ctx;
}
