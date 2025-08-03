import React from "react";
import CustomButton from "../CustomButton";
import { servicesData } from "./servicesCardData";

export default function ServicesCard() {
  
  return (
    <div className="mx-auto my-16">
      {servicesData.map((data: { id: React.Key | null | undefined; title: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined; description: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; image: string | undefined; }) => (
        <div
          key={data.id}
          className="grid my-10 gap-y-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-center"
        >
          <div className="col-span-1 flex items-start justify-start">
            <span className="text-orange-500 font-bold font-main text-6xl sm:text-7xl lg:text-8xl">
              {`[0${data.id}]`}
            </span>
          </div>
          <div className="sm:col-span-1 lg:col-span-2 flex flex-col justify-between items-start gap-6">
            <h2 className="text-orange-700 font-main text-2xl sm:text-3xl lg:text-4xl">
              {data.title}
            </h2>
            <p className="text-white text-md w-100 font-secondary">
              {data.description}
            </p>
            <CustomButton secondary label="Web Development" href="#" />
          </div>
          <div className="sm:col-span-1 lg:col-span-2 flex items-center justify-center">
            {data.image && (
              <img
                className="w-full h-75 max-w-xs sm:max-w-sm lg:max-w-md object-cover"
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
