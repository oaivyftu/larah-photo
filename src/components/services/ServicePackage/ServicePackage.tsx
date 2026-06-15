import styles from "./ServicePackage.module.scss";

type ServicePackageProps = {
  children?: React.ReactNode;
};

export function ServicePackage({ children }: ServicePackageProps) {
  return <article className={styles["service-package"]}>{children}</article>;
}
