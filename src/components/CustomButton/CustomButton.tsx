import { Link } from "react-router-dom";
import type { MouseEventHandler, ReactNode } from "react";
import "./CustomButton.css";

export type CustomButtonVariant = "primary" | "secondary" | "light" | "accent";
export type CustomButtonSize = "lg" | "md" | "sm" | "pill";

export interface CustomButtonProps {
  label?: string;
  children?: ReactNode;
  href?: string;
  to?: string;
  variant?: CustomButtonVariant;
  size?: CustomButtonSize;
  /** @deprecated Prefer `variant="secondary"` */
  secondary?: boolean;
  /** @deprecated Prefer `variant="light"` */
  light?: boolean;
  newTab?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  type?: "button" | "submit";
  className?: string;
  fullWidth?: boolean;
  /** Alternate label shown below 992px when `label` is also set */
  mobileLabel?: string;
}

function resolveVariant(
  variant: CustomButtonVariant | undefined,
  secondary: boolean,
  light: boolean,
): CustomButtonVariant {
  if (variant) return variant;
  if (light) return "light";
  if (secondary) return "secondary";
  return "primary";
}

export default function CustomButton({
  label,
  children,
  href,
  to,
  variant,
  size = "lg",
  secondary = false,
  light = false,
  newTab = false,
  onClick,
  type = "button",
  className = "",
  fullWidth = false,
  mobileLabel,
}: CustomButtonProps) {
  const resolvedVariant = resolveVariant(variant, secondary, light);

  const classes = [
    "custom-btn",
    `custom-btn--${resolvedVariant}`,
    `custom-btn--${size}`,
    fullWidth ? "custom-btn--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content =
    children ??
    (mobileLabel && label ? (
      <>
        <span className="custom-btn__label custom-btn__label--desktop">
          {label}
        </span>
        <span className="custom-btn__label custom-btn__label--mobile">
          {mobileLabel}
        </span>
      </>
    ) : (
      <span className="custom-btn__label">{label}</span>
    ));

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick}>
      {content}
    </button>
  );
}
