import React from "react";

export default function WhoAreWe() {
  return (
    <>
      <section className="p-5 bg-gray-700 flex flex-col w-screen h-screen justify-evenly"><header><strong>[ABOUT_US]</strong></header>
        <div>
          <h2 className="font-secondary text-orange-500 font-bold text-[5rem] sm:text-[10rem] w-100 leading-tight line-clamp-2">
            [Who We Are]
          </h2>
        </div>
        
        <p className="font-semibold text-3xl text-start w-1/2 text-gray-300">
          At Cicero Web Studio, we specialize in helping small businesses in the
          Chicago area thrive in the digital landscape. We believe that every
          project is a partnership, where your success is our success. 
        </p>
      </section>
    </>
  );
}
