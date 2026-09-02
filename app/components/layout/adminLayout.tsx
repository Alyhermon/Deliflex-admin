"use client";

import Sidebar from "./sidebar";
import Footer from "./footer";
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
        <main className={styles.main}>{children}</main>

        <Footer />
      </div>
    </div>
  );
}