import styles from "./ServiceList.module.scss";

type ServiceListProps = {
  children?: React.ReactNode;
};

export function ServiceList({ children }: ServiceListProps) {
  return <section className={styles["service-list"]}>{children}</section>;
}
