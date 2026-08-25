import Image, { type ImageProps } from "next/image";
import styles from "./LarahImage.module.scss";

export function LarahImage({ alt, className, ...props }: ImageProps) {
  const classes = [styles["larah-image"], className].filter(Boolean).join(" ");
  const placeholder =
    props.placeholder ?? (props.blurDataURL ? "blur" : "empty");

  return (
    <Image alt={alt} className={classes} {...props} placeholder={placeholder} />
  );
}
