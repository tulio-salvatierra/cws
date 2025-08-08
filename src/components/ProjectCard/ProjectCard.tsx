
interface ProjectCardProps {
  title: string;
  images: string;
  alt: string;
  description: string;
  link: string;
};

export default function ProjectCard({ title, images, alt, description, link }: ProjectCardProps) {
  return (
    <>
      <div className=" bg-zinc-700/50 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <img
          src={images}
          alt={alt || "Project Image"} // Default alt text if not provided
          loading="lazy"
          className="w-full h-40 object-cover"
        />
        <div className="p-6">
          <h3 className="text-xl font-main font-semibold text-orange-700">
            {title}
          </h3>
          <p className="mt-2 text-white text-sm">{description}</p>
          <a
            href={link}
            target="_blank"
            className="inline-block mt-4 text-white font-medium hover:underline"
          >
            View Project →
          </a>
        </div>
      </div>
    </>
  );
}
