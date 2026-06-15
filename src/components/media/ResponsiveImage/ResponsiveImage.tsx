import Image, { type ImageProps } from "next/image";
import styles from "./ResponsiveImage.module.scss";

export function ResponsiveImage({ alt, className, ...props }: ImageProps) {
  const classes = [styles["responsive-image"], className]
    .filter(Boolean)
    .join(" ");

  return <Image alt={alt} className={classes} {...props} />;
}
