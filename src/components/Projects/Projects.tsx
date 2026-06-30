import { useRef, useState } from "react";
import { projects } from "./ProjectsData";
import problemDivider from "../../assets/images/problem/divider.svg";
import "./Projects.css";

function formatStep(current: number, total: number) {
  return `${String(current).padStart(2, "0")}/${String(total).padStart(2, "0")}`;
}

type ProjectEntryProps = {
  title: string;
  image: string;
  alt: string;
  description: string;
  link: string;
  step: string;
};

function ProjectMedia({ image, alt }: { image: string; alt: string }) {
  if (image.endsWith(".mp4")) {
    return (
      <video
        src={image}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        disableRemotePlayback
        className="projects-card__media"
        onEnded={(event) => {
          event.currentTarget.currentTime = 0;
          event.currentTarget.play();
        }}
      />
    );
  }

  return (
    <img
      src={image}
      alt={alt}
      loading="lazy"
      className="projects-card__media"
    />
  );
}

function ProjectEntry({
  title,
  image,
  alt,
  description,
  link,
  step,
}: ProjectEntryProps) {
  return (
    <>
      <div className="projects-card__frame">
        <div className="projects-card__frame-inner">
          <ProjectMedia image={image} alt={alt} />
        </div>
      </div>

      <div className="projects-card__content">
        <span className="projects-card__step">{step}</span>
        <h3 className="projects-card__title">{title}</h3>
        <p className="projects-card__description">{description}</p>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="projects-card__link"
        >
          View project →
        </a>
      </div>
    </>
  );
}

export default function Projects() {
  const total = projects.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollToSlide = (index: number) => {
    setActiveIndex(index);
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <section id="projects" className="projects-section">
      <div className="projects-section__inner">
        <div className="projects-section__header">
          <span className="projects-section__icon" aria-hidden="true" />
          <p className="projects-section__eyebrow">Success Stories</p>
        </div>

        <div className="projects-section__list">
          {projects.map((project, index) => (
            <div key={project.title}>
              <article className="projects-card">
                <ProjectEntry
                  {...project}
                  step={formatStep(index + 1, total)}
                />
              </article>
              {index < projects.length - 1 ? (
                <img
                  src={problemDivider}
                  alt=""
                  className="projects-section__divider"
                  aria-hidden="true"
                />
              ) : null}
            </div>
          ))}
        </div>

        <div className="projects-section__carousel">
          <div
            ref={trackRef}
            className="projects-section__carousel-track"
            onScroll={(event) => {
              const track = event.currentTarget;
              const slideWidth = track.firstElementChild?.clientWidth ?? 1;
              const gap = 16;
              const index = Math.round(track.scrollLeft / (slideWidth + gap));
              if (index !== activeIndex && index >= 0 && index < total) {
                setActiveIndex(index);
              }
            }}
          >
            {projects.map((project, index) => (
              <div key={project.title} className="projects-section__carousel-slide">
                <div className="projects-card__content">
                  <span className="projects-card__step">
                    {formatStep(index + 1, total)}
                  </span>
                  <h3 className="projects-card__title">{project.title}</h3>
                  <p className="projects-card__description">
                    {project.description}
                  </p>
                </div>
                <div className="projects-card__frame">
                  <div className="projects-card__frame-inner">
                    <ProjectMedia image={project.image} alt={project.alt} />
                  </div>
                </div>
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="projects-card__link"
                >
                  View project →
                </a>
              </div>
            ))}
          </div>

          <div className="projects-section__dots" role="tablist" aria-label="Project slides">
            {projects.map((project, index) => (
              <button
                key={project.title}
                type="button"
                role="tab"
                className={`projects-section__dot${
                  index === activeIndex ? " is-active" : ""
                }`}
                aria-label={`Go to ${project.title}`}
                aria-selected={index === activeIndex}
                onClick={() => scrollToSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
