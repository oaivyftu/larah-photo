import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./CallToAction.module.scss";

type CallToActionProps = Omit<
  ComponentPropsWithoutRef<"section">,
  "aria-labelledby" | "children" | "className"
> & {
  heading: string;
  /** The id `aria-labelledby` points at; unique on the page. */
  headingId: string;
  body: string;
  /** The actions row: buttons or links. */
  children: ReactNode;
  /** Placement only: the caller sets its own width and top margin. */
  className?: string;
};

/**
 * A heading, a line of text and the way on, closing a page: the journal post's
 * end (spec 013 FR-011) and the service landing page's (spec 014 FR-018). The
 * wording is the caller's — always the editor's — and so are the actions; only
 * the rhythm lives here. `data-*` hooks and other section attributes pass
 * through to the `section`.
 */
export function CallToAction({
  heading,
  headingId,
  body,
  children,
  className,
  ...rest
}: CallToActionProps) {
  return (
    <section
      {...rest}
      aria-labelledby={headingId}
      className={[styles["cta"], className].filter(Boolean).join(" ")}
    >
      <h2 className={styles["cta__heading"]} id={headingId}>
        {heading}
      </h2>
      <p className={styles["cta__body"]}>{body}</p>
      <div className={styles["cta__actions"]}>{children}</div>
    </section>
  );
}
