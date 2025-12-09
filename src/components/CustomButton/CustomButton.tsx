import "./CustomButton.css";

interface CustomButtonProps {
  label: string;
  href?: string;
  secondary?: boolean; // optional prop to toggle styling
  newTab?: boolean;     // open in new tab if needed
  onClick?: () => void; // optional click handler
}

export default function CustomButton({ label, href, secondary = false, newTab = false, onClick }: CustomButtonProps) {
  return (
    <a
      href={href || "#"}
      className={`btn-bounce ${secondary ? "is--secondary" : ""}`}
      target={newTab ? "_blank" : "_self"}
      rel={newTab ? "noopener noreferrer" : ""}
      onClick={onClick}
    >
      <div className={`btn-bounce-bg ${secondary ? "is--secondary" : ""} w-full`}></div>
      <div className="btn-bounce-text__wrap">
        <span className="w-auto btn-bounce-text text-white font-main font-semibold sm:text-md text-sm">{label}</span>
      </div>
    </a>
  );
}