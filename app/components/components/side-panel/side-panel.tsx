import styles from "./side-panel.module.css";
import { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark} from "@fortawesome/free-solid-svg-icons";

type SidePanelProps = {
  open?: boolean;
  title?: string;
  side?: "left" | "right";
  background?: string;
  width?: string;
  children?: ReactNode;
  onClose?: () => void;
};

export default function SidePanel({
  open = false,
  title = "Panel",
  side = "right",
  background = "#FFFFFF",
  width = "460px",
  children,
  onClose,
}: SidePanelProps) {
    
  if (!open) return null;


  return (
    <div className={styles.sidePanelOverlay}> 
      <aside
        className={`
          ${styles.sidePanel}
          ${styles[`side-panel-${side}`]}
        `}
        style={
          {
            "--panel-width": width,
            "--panel-bg": background,
          } as React.CSSProperties
        }
      >
        <div className={styles.sidePanelHeader}>
          <span className={styles.sideTitle}>{title}</span>

          <button
            onClick={onClose}
            className={styles["close-button"]}
          >
            <FontAwesomeIcon icon={faCircleXmark} color="#ff7a00" size="lg"/>
          </button>
        </div>

        <div className={styles.sidePanelContent}>{children}</div>
      </aside>
    </div>  
  );
}
