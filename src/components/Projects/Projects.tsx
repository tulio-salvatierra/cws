import { useRef, useState } from "react";
import { projects } from "./ProjectsData";
import problemDivider from "../../assets/images/problem/divider.svg";
import CustomButton from "../CustomButton";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import "./Projects.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

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
        <CustomButton
          label="View project →"
          href={link}
          newTab
          variant="primary"
          className="projects-card__link"
        />
      </div>
    </>
  );
}

/** Same reveal as Problem showcase: panel rises → media scales to 1 → copy eases up. */
function createCardReveal(card: HTMLElement) {
  const mediaWrap = card.querySelector<HTMLElement>(".projects-card__frame-inner");
  const media = card.querySelector<HTMLElement>(".projects-card__media");
  const textItems = gsap.utils.toArray<HTMLElement>(
    card.querySelectorAll(
      ".projects-card__step, .projects-card__title, .projects-card__description, .projects-card__link",
    ),
  );

  if (!mediaWrap || !media) return;

  gsap.set(mediaWrap, { yPercent: 110 });
  gsap.set(media, { scale: 1.35, transformOrigin: "50% 50%" });
  if (textItems.length) {
    gsap.set(textItems, { y: 56, opacity: 0 });
  }

  const reveal = gsap.timeline({
    defaults: { ease: "power3.out" },
    scrollTrigger: {
      trigger: card,
      start: "top 85%",
      once: true,
    },
  });

  reveal
    .to(mediaWrap, {
      yPercent: 0,
      duration: 1.35,
      ease: "power4.out",
    })
    .to(
      media,
      {
        scale: 1,
        duration: 1.9,
        ease: "power3.out",
      },
      0.12,
    )
    .to(
      textItems,
      {
        y: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.12,
        ease: "power3.out",
      },
      0.55,
    );
}

export default function Projects() {
  const total = projects.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 992px)", () => {
        gsap.utils
          .toArray<HTMLElement>(".projects-card")
          .forEach(createCardReveal);
      });

      mm.add("(max-width: 991px)", () => {
        gsap.utils
          .toArray<HTMLElement>(".projects-section__carousel-slide")
          .forEach(createCardReveal);
      });

      return () => {
        mm.revert();
      };
    },
    { scope: sectionRef },
  );

  const scrollToSlide = (index: number) => {
    setActiveIndex(index);
    const track = trackRef.current;
    if (!track) return;
    const slide = track.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <section ref={sectionRef} id="projects" className="projects-section">
      <div className="projects-section__inner">
        <div className="projects-section__header">
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
                <CustomButton
                  label="View project →"
                  href={project.link}
                  newTab
                  variant="primary"
                  className="projects-card__link"
                />
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
