import React from "react";



export default function Hero() {
  return (
    <>
      <main className="p-5  flex flex-col w-screen h-screen justify-items-start bg-hero bg-cover bg-center"
        style={{  backgroundSize: '50%', backgroundPosition: 'right', backgroundRepeat: 'no-repeat'}}>
        <div>
          <h1 className="font-secondary font-bold text-[4rem] sm:text-[6  rem] w-100 leading-tight line-clamp-3 ">
            Giving your business a digital leg up
          </h1>
          <h1 className="font-main font-thin sm:text-[1rem]">
            [by Tulio Salvatierra]
          </h1>
        </div>
        <p className="font-semibold text-2xl">
          By partnering with Cicero Web Studio, you can expect a tailored
          approach to your digital needs. We specialize in helping small
          businesses in the Chicago area thrive in the digital landscape.
        </p>
      </main>
    </>
  );
}


