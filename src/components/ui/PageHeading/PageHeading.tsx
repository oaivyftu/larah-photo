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
    // The words are separate spans with no text node between them, so the
    // accessible name computation concatenates them: "Selected" + "Work" is
    // announced as "SelectedWork". The gap that separates them is `gap` on a
    // flex container, which is layout and carries no text. An explicit label
    // restores the spacing for assistive tech without adding an anonymous
    // flex item that would shift the visual layout.
    <h1
      aria-label={words.join(" ")}
      className={classNames}
      data-page-heading
      id={id}
    >
      {words.map((word, index) => (
        <span key={`${word}-${index}`}>{word}</span>
      ))}
    </h1>
  );
}
