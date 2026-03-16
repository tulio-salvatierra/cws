import ProjectCard from "../ProjectCard";
import { projects } from "./ProjectsData";
import { useFadeIn } from "../../Hooks/useFadeIn";
import { useScramble } from "../../Hooks/useScramble";
import MaskedLines from "../MaskedLines/MaskedLines";
export default function Projects() {
  const scrambleRef = useScramble("RECENT WORK", 0.1);
  const fadeInRef = useFadeIn();
  return (
    <section
      id="projects"
      className="flex flex-col w-full h-auto justify-evenly p-1"
    >
      <div className="flex flex-col mb-10">
        <strong className="text-black text-left">[RECENT WORK]</strong>
        <h2 ref={scrambleRef} className="font-main text-left font-bold sm:text-[6rem] text-[3rem] text-black w-100 leading-tight">
          Recent Work
        </h2>
      </div>
      <div className="grid gap-40">
        <div>
          <MaskedLines
            as="p"
            scroll
            scrollStart="top 85%" 
            className="font-main text-2xl sm:text-3xl text-black w-100 leading-tight"
          >
            Real results for Chicago businesses. Every project is built with one goal: websites that actually bring in customers. From sleek, high-converting sites to interactive applications, our work blends style, speed, and smart technology—delivering more bookings, calls, and sales.
          </MaskedLines>
        </div>
    
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 w-full mx-auto">
        {projects.map((project, index) => (
          <div key={project.title} className="min-h-[320px] h-full">
            <ProjectCard
              title={project.title}
              images={project.image}
              alt={project.alt}
              description={project.description}
              link={project.link}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
