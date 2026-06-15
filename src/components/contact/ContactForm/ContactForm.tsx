import styles from "./ContactForm.module.scss";

type ContactFormProps = {
  children?: React.ReactNode;
};

export function ContactForm({ children }: ContactFormProps) {
  return <form className={styles["contact-form"]}>{children}</form>;
}
