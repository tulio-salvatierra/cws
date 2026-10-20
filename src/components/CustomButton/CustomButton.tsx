import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./CustomButton.css";

export type ButtonVariant = "primary" | "secondary";

interface CustomButtonProps {
  label?: string;
  children?: ReactNode;
  href?: string;
  to?: string;
  variant?: ButtonVariant;
  secondary?: boolean;
  light?: boolean;
  newTab?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  fullWidth?: boolean;
}

export default function CustomButton({
  label,
  children,
  href,
  to,
  variant,
  secondary = false,
  light = false,
  newTab = false,
  onClick,
  type = "button",
  className = "",
  fullWidth = false,
}: CustomButtonProps) {
  const resolvedVariant: ButtonVariant =
    variant ?? (secondary ? "secondary" : "primary");

  const classes = [
    "custom-btn",
    `custom-btn--${resolvedVariant}`,
    light ? "custom-btn--light" : "",
    fullWidth ? "custom-btn--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <span className="custom-btn__label">{children ?? label}</span>
  );

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
