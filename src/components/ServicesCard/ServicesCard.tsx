import { servicesData } from "./servicesCardData";
import { useFadeIn } from "../../Hooks/useFadeIn";
export default function ServicesCard() {
  const fadeInRef = useFadeIn();
  return (
    <div ref={fadeInRef} className="flex flex-col mx-auto my-4 w-full ">
      {servicesData.map((data: { id: React.Key | null | undefined; title: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined; description: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; image: string | undefined; }) => (
        <div
          key={data.id}
          className="grid hover:bg-zinc-800 transition-all duration-200 bg-zinc-100/5 p-2 rounded-md my-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-start mx-auto w-full "
        >
          <div className="col-span-1 flex items-start justify-start">
            <span className="text-orange-500/80 font-bold font-main text-xl">
              {`[0${data.id}]`}
            </span>
          </div>
          <div className="sm:col-span-1 lg:col-span-2 flex flex-col justify-start gap-6 h-full">
            <h2 className="text-orange-500/80 font-main text-2xl sm:text-3xl lg:text-4xl">
              {data.title}
            </h2>
            <p className="text-zinc-400 text-lg w-100 font-secondary">
              {data.description}
            </p>
            
          </div>
          <div className="sm:col-span-1 lg:col-span-2 flex items-start justify-center h-full">
            {data.image && (
              <img
                className="w-auto mx-auto h-[250px] max-w-xs sm:max-w-sm lg:max-w-md sm:ml-auto object-fit hover:rotate-180 transition-all duration-200"
                src={data.image}
                alt={typeof data.title === 'string' ? data.title : 'Service Image'}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
