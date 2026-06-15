import styles from "./TextArea.module.scss";

type TextAreaProps = {
  name: string;
};

export function TextArea({ name }: TextAreaProps) {
  return <textarea className={styles["text-area"]} name={name} />;
}
