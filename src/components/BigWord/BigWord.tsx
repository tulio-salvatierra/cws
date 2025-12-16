import "./BigWord.css";

export default function BigWord({ text, className = "" }: { text: string; className?: string }) {
  return (
    <section>
    <div
      aria-hidden
      className={`bigword-container ${className}`}
    >
      {text}
    </div>
    </section>
  );
}