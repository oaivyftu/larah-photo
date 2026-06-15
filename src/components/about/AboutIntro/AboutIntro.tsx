import styles from "./AboutIntro.module.scss";

type AboutIntroProps = {
  children?: React.ReactNode;
};

export function AboutIntro({ children }: AboutIntroProps) {
  return <section className={styles["about-intro"]}>{children}</section>;
}
