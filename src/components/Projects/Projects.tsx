import ProjectCard from "../ProjectCard";
import { projects } from "./ProjectsData";

export default function Projects() {
  return (
    <section
      id="projects"
      className="flex flex-col w-screen h-auto justify-evenly mx-5 my-32"
    >
      <div className="flex flex-col mb-10">
        <strong className="text-orange-500 text-left">[PROJECTS]</strong>
        <h2 className="font-main text-left font-black sm:text-[6rem] text-[3rem] text-zinc-700 sm:text-[6  rem] w-100 leading-tight">
          What we do
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-40 group-[]:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
        <div>
          <h3 className="font-main font-black text-orange-500 text-4xl sm:text-md text-start w-100">
            At Cicero Web Studio, every project is built with one goal in mind:
            helping businesses stand out online. From sleek, high-converting
            websites to interactive, custom-built applications, our work blends
            style, speed, and smart technology.
          </h3>
        </div>
        <div></div>
        <div></div>
        <div>
          {" "}
          <p className="font-secondary text-white text-xl sm:text-md text-start w-100 p-4">
            At Cicero Web Studio, every project is built with one goal in mind:
            helping businesses stand out online. From sleek, high-converting
            websites to interactive, custom-built applications, our work blends
            style, speed, and smart technology.
          </p>
        </div>
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 mt-10">
  {projects.map((project, index) => (
    <div key={index} className="mb-6 break-inside-avoid">
      <ProjectCard
        title={project.title}
        images={project.image}       // note: prop is `image`, not `images`
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
