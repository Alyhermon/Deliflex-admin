"use client";

import Sidebar from "./sidebar";
import { ReactNode } from "react";
import styles from "./layout.module.css";

type Props = {
  children: ReactNode;
};

export default function AdminLayout({ children }: Props) {
  return (
    <div className={styles.layout}>
      <Sidebar />

      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}