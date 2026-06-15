import styles from "./TextInput.module.scss";

type TextInputProps = {
  name: string;
};

export function TextInput({ name }: TextInputProps) {
  return <input className={styles["text-input"]} name={name} />;
}
