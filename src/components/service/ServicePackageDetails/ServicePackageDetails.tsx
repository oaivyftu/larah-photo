import styles from "./ServicePackageDetails.module.scss";

type ServicePackageDetailsProps = {
  features: string[];
  price: number;
  /** Where the caller places the block (a grid cell, a column); this component
   *  styles only its own contents. */
  className?: string;
};

/**
 * A package's features and its starting price: the block the services page and
 * every service landing page show, so "the same details the services page
 * shows" (spec 014 FR-016) is a fact about the code and not about two
 * components agreeing. One root element, so a caller can give it a grid cell.
 */
export function ServicePackageDetails({
  features,
  price,
  className,
}: ServicePackageDetailsProps) {
  return (
    <div
      className={[styles["package-details"], className]
        .filter(Boolean)
        .join(" ")}
    >
      <ul>
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <div>
        <span>STARTING FROM</span>
        <strong>${price}</strong>
      </div>
    </div>
  );
}
