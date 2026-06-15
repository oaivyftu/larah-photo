import styles from "./SelectInput.module.scss";

type SelectInputProps = {
  name: string;
};

export function SelectInput({ name }: SelectInputProps) {
  return <select className={styles["select-input"]} name={name} />;
}
