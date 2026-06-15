import styles from "./SubmitButton.module.scss";

type SubmitButtonProps = {
  children?: React.ReactNode;
};

export function SubmitButton({ children }: SubmitButtonProps) {
  return (
    <button className={styles["submit-button"]} type="submit">
      {children}
    </button>
  );
}
