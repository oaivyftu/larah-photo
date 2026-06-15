import { SiteFooter } from "@/components/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader/SiteHeader";
import { SocialMarquee } from "@/components/layout/SocialMarquee/SocialMarquee";
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

export function PageShell({ children, variant }: PageShellProps) {
  const isHome = variant === "home";

  return (
    <div className={styles["page-shell"]} id="top">
      <SiteHeader activeHref={activeHrefByVariant[variant]} hideBrand={isHome} />
      <main
        className={`${styles["page-shell__main"]} ${styles[`page-shell__main--${variant}`]}`}
      >
        {children}
      </main>
      <SocialMarquee />
      <SiteFooter />
    </div>
  );
}
