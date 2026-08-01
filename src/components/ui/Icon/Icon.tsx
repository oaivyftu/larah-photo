import type { IconDefinition } from "@/constants/icons";
import styles from "./Icon.module.scss";

type IconProps = {
  "aria-label"?: string;
  className?: string;
  decorative?: boolean;
  icon: IconDefinition;
};

export function Icon({
  "aria-label": ariaLabel,
  className,
  decorative,
  icon,
}: IconProps) {
  const isDecorative = decorative ?? !ariaLabel;
  const classNames = [styles["icon"], className].filter(Boolean).join(" ");

  return (
    <svg
      aria-hidden={isDecorative ? "true" : undefined}
      aria-label={isDecorative ? undefined : ariaLabel}
      className={classNames}
      data-icon={icon.name}
      role={isDecorative ? undefined : "img"}
      viewBox={icon.viewBox}
    >
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
}
