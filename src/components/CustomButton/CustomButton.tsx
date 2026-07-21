import "./CustomButton.css";

interface CustomButtonProps {
  label: string;
  href?: string;
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
  href,
  secondary = false,
  light = false,
  newTab = false,
  onClick,
  type = "button",
  className = "",
  fullWidth = false,
}: CustomButtonProps) {
  const classes = [
    "custom-btn",
    secondary ? "custom-btn--secondary" : "",
    light ? "custom-btn--light" : "",
    fullWidth ? "custom-btn--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = <span className="custom-btn__label">{label}</span>;

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
