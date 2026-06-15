import styles from "./WorkCard.module.scss";

type WorkCardProps = {
  children?: React.ReactNode;
};

export function WorkCard({ children }: WorkCardProps) {
  return <article className={styles["work-card"]}>{children}</article>;
}
