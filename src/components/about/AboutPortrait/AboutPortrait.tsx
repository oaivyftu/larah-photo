import styles from "./AboutPortrait.module.scss";

type AboutPortraitProps = {
  children?: React.ReactNode;
};

export function AboutPortrait({ children }: AboutPortraitProps) {
  return <figure className={styles["about-portrait"]}>{children}</figure>;
}
