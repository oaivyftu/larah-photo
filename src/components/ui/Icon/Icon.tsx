import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type {
  FontAwesomeIconProps,
} from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type IconProps = {
  "aria-label"?: string;
  className?: string;
  decorative?: boolean;
  icon: IconDefinition;
  size?: FontAwesomeIconProps["size"];
};

export function Icon({
  "aria-label": ariaLabel,
  className,
  decorative,
  icon,
  size,
}: IconProps) {
  const isDecorative = decorative ?? !ariaLabel;

  return (
    <FontAwesomeIcon
      aria-hidden={isDecorative ? "true" : undefined}
      aria-label={isDecorative ? undefined : ariaLabel}
      className={className}
      icon={icon}
      role={isDecorative ? undefined : "img"}
      size={size}
    />
  );
}
