import styles from "./WorkGrid.module.scss";

type WorkGridProps = {
  children?: React.ReactNode;
};

export function WorkGrid({ children }: WorkGridProps) {
  return <section className={styles["work-grid"]}>{children}</section>;
}
