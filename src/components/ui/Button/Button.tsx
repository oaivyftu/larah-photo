import Link from "next/link";
import { Icon } from "@/components/ui/Icon/Icon";
import { icons } from "@/constants/icons";
import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "small" | "medium" | "large";

type SharedProps = {
  children: React.ReactNode;
  className?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  withIcon?: boolean;
};

type ButtonElementProps = SharedProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedProps> & {
    href?: undefined;
  };

type AnchorElementProps = SharedProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof SharedProps> & {
    href: string;
  };

type ButtonProps = ButtonElementProps | AnchorElementProps;

function isExternalHref(href: string) {
  return !href.startsWith("/") || href.startsWith("//");
}

export function Button({
  children,
  className,
  size = "small",
  variant = "primary",
  withIcon = false,
  ...rest
}: ButtonProps) {
  const classNames = [
    styles["button"],
    styles[`button--${variant}`],
    styles[`button--${size}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span>{children}</span>
      {withIcon ? (
        <Icon
          className={styles["button__icon"]}
          decorative
          icon={icons.arrowRight}
        />
      ) : null}
    </>
  );

  if (rest.href === undefined) {
    const { type = "button", ...buttonProps } =
      rest as Omit<ButtonElementProps, keyof SharedProps>;

    return (
      <button className={classNames} type={type} {...buttonProps}>
        {content}
      </button>
    );
  }

  const { href, ...anchorProps } = rest as Omit<
    AnchorElementProps,
    keyof SharedProps
  >;

  if (isExternalHref(href)) {
    return (
      <a className={classNames} href={href} {...anchorProps}>
        {content}
      </a>
    );
  }

  return (
    <Link className={classNames} href={href} {...anchorProps}>
      {content}
    </Link>
  );
}
