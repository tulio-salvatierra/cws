import "./CustomButton.css";

interface CustomButtonProps {
  label: string;
  href: string;
  secondary?: boolean; // optional prop to toggle styling
  newTab?: boolean;     // open in new tab if needed
}

export default function CustomButton({ label, href, secondary = false, newTab = false }: CustomButtonProps) {
  return (
    <a
      href={href}
      className={`btn-bounce ${secondary ? "is--secondary" : ""}`}
      target={newTab ? "_blank" : "_self"}
      rel={newTab ? "noopener noreferrer" : ""}
    >
      <div className={`btn-bounce-bg ${secondary ? "is--secondary" : ""}`}></div>
      <div className="btn-bounce-text__wrap">
        <span className="btn-bounce-text">{label}</span>
      </div>
    </a>
  );
}