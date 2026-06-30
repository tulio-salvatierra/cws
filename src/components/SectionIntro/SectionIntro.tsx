import "./SectionIntro.css";

type SectionIntroProps = {
  title: string;
  id?: string;
};

export default function SectionIntro({ title, id }: SectionIntroProps) {
  return (
    <div className="section-intro" id={id}>
      <h2 className="section-intro__title">{title}</h2>
    </div>
  );
}
