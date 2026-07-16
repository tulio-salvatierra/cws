import { processSteps } from "./processData";
import ProcessStepMedia from "./ProcessStepMedia";
import SectionIntro from "../SectionIntro/SectionIntro";
import "./Process.css";

function formatStepLabel(step: string) {
  return `STEP • ${step}`;
}

export default function Process() {
  return (
    <section id="process" className="process-section">
      <SectionIntro title="PROCESS" id="process-intro" />

      <div className="process-section__stage">
        {processSteps.map((item) => (
          <article key={item.id} className="process-step-block">
            <div className="process-step__copy">
              <p className="process-step__label">{formatStepLabel(item.step)}</p>
              <h3 className="process-step__title">{item.title}</h3>
              <p className="process-step__description">{item.description}</p>
            </div>

            <div className="process-step__media">
              <ProcessStepMedia video={item.video} poster={item.poster} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
