import styles from "./PageHeading.module.scss";

type PageHeadingProps = {
  className?: string;
  id?: string;
  words: string[];
};

/**
 * The single page title used by Work, Service, About and Contact. Each word is
 * its own `<span>` so the pages' GSAP intro can mask-reveal them one by one,
 * and the closing word carries the serif face the design asks for.
 */
export function PageHeading({ className, id, words }: PageHeadingProps) {
  const classNames = [styles["page-heading"], className]
    .filter(Boolean)
    .join(" ");

  return (
    <h1 className={classNames} data-page-heading id={id}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`}>{word}</span>
      ))}
    </h1>
  );
}
