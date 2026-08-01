import { SiteFooter } from "@/components/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader/SiteHeader";
import { getSiteSettings } from "@/sanity/fetchers";
import styles from "./PageShell.module.scss";

type PageShellProps = {
  children?: React.ReactNode;
  variant: "home" | "work" | "project" | "about" | "service" | "contact";
};

const activeHrefByVariant: Record<PageShellProps["variant"], string> = {
  home: "/",
  work: "/work",
  project: "/work",
  about: "/about",
  service: "/service",
  contact: "/contact",
};

export async function PageShell({ children, variant }: PageShellProps) {
  const settings = await getSiteSettings();

  return (
    // `tabIndex={-1}`: the footer's "back to top" link targets this element,
    // and without it the browser scrolls but leaves focus stranded at the
    // bottom of the page.
    <div
      className={styles["page-shell"]}
      data-page-shell
      id="top"
      tabIndex={-1}
    >
      <a className={styles["page-shell__skip"]} href="#main-content">
        Skip to content
      </a>
      <SiteHeader
        activeHref={activeHrefByVariant[variant]}
        /* The home hero carries the full-size logo mark, so the nav drops its
           own brand there rather than showing it twice. */
        hideBrand={variant === "home"}
        instagramUrl={settings.instagramUrl}
        navigationItems={settings.navigationItems}
        siteName={settings.name}
      />
      <main
        className={[
          styles["page-shell__main"],
          styles[`page-shell__main--${variant}`],
        ]
          .filter(Boolean)
          .join(" ")}
        id="main-content"
        /* Focusable only as a programmatic target: the skip link and the
           route-change announcer both move focus here. */
        tabIndex={-1}
      >
        {children}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
