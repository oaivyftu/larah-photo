import styles from "./PhoneInput.module.scss";

type PhoneInputProps = {
  name: string;
};

export function PhoneInput({ name }: PhoneInputProps) {
  return <input className={styles["phone-input"]} name={name} type="tel" />;
}
