import React from "react";



export default function Hero() {
  return (
    <>
      <main className="p-5  flex flex-col w-screen h-screen justify-evenly"
        style={{  backgroundSize: '50%', backgroundPosition: 'right', backgroundRepeat: 'no-repeat'}}>
        <div>
          <h1 className="font-secondary font-bold text-[4rem] sm:text-[10rem] w-100 leading-tight line-clamp-2">
            Cicero Web Studio
          </h1>
          <h1 className="font-main font-thin sm:text-[1rem]">
            [by Tulio Salvatierra]
          </h1>
        </div>
        <p className="font-semibold text-2xl">
          Your partner in creating web solutions that grow your business.
        </p>
      </main>
    </>
  );
}


