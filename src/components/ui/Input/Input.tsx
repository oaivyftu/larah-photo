import { Icon } from "@/components/ui/Icon/Icon";
import { icons } from "@/constants/icons";
import styles from "./Input.module.scss";

/**
 * The design system's `Input` component. Its four Figma variants map onto state
 * rather than props: `Default` is the resting field, `Fill` is what a field
 * with a value looks like (`data-filled`), `Error` is a field carrying a
 * message (`data-invalid`), and `area` is the multi-line `Textarea` export.
 */
type FieldShellProps = {
  children: React.ReactNode;
  className?: string;
  error?: string;
  errorId: string;
  filled: boolean;
  id: string;
  label: string;
  multiline?: boolean;
  required?: boolean;
};

function FieldShell({
  children,
  className,
  error,
  errorId,
  filled,
  id,
  label,
  multiline = false,
  required = false,
}: FieldShellProps) {
  const classNames = [
    styles["input"],
    multiline ? styles["input--area"] : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      data-filled={filled ? "" : undefined}
      data-invalid={error ? "" : undefined}
    >
      <label className={styles["input__control"]} htmlFor={id}>
        <span className={styles["input__label"]}>
          {label}
          {required ? (
            <span className={styles["input__required"]}>*</span>
          ) : null}
        </span>
        {children}
      </label>
      {/* Always rendered: it reserves the message row so a failing field does
          not shift the rest of the form, and keeps the live region mounted. */}
      <p className={styles["input__error"]} id={errorId}>
        {error}
      </p>
    </div>
  );
}

type SharedProps = {
  className?: string;
  error?: string;
  id: string;
  label: string;
};

export type InputProps = SharedProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "id">;

export function Input({
  className,
  error,
  id,
  label,
  required,
  value,
  ...rest
}: InputProps) {
  const errorId = `${id}-error`;

  return (
    <FieldShell
      className={className}
      error={error}
      errorId={errorId}
      filled={Boolean(value)}
      id={id}
      label={label}
      required={required}
    >
      <span className={styles["input__value"]}>
        <input
          aria-describedby={errorId}
          aria-invalid={error ? true : undefined}
          className={styles["input__field"]}
          id={id}
          required={required}
          value={value}
          {...rest}
        />
      </span>
    </FieldShell>
  );
}

export type SelectProps = SharedProps & {
  options: string[];
  placeholder: string;
} & Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "children" | "className" | "id"
  >;

export function Select({
  className,
  error,
  id,
  label,
  options,
  placeholder,
  required,
  value,
  ...rest
}: SelectProps) {
  const errorId = `${id}-error`;

  return (
    <FieldShell
      className={className}
      error={error}
      errorId={errorId}
      filled={Boolean(value)}
      id={id}
      label={label}
      required={required}
    >
      <span className={styles["input__value"]}>
        <select
          aria-describedby={errorId}
          aria-invalid={error ? true : undefined}
          className={styles["input__field"]}
          id={id}
          required={required}
          value={value}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Icon
          className={styles["input__icon"]}
          decorative
          icon={icons.chevronDown}
        />
      </span>
    </FieldShell>
  );
}

export type TextareaProps = SharedProps &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "id">;

export function Textarea({
  className,
  error,
  id,
  label,
  required,
  rows = 5,
  value,
  ...rest
}: TextareaProps) {
  const errorId = `${id}-error`;

  return (
    <FieldShell
      className={className}
      error={error}
      errorId={errorId}
      filled={Boolean(value)}
      id={id}
      label={label}
      multiline
      required={required}
    >
      <textarea
        aria-describedby={errorId}
        aria-invalid={error ? true : undefined}
        className={`${styles["input__field"]} ${styles["input__field--area"]}`}
        id={id}
        required={required}
        rows={rows}
        value={value}
        {...rest}
      />
    </FieldShell>
  );
}
