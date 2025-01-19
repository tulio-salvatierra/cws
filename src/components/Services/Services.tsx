import React from "react";

export default function Services() {
  return (
    <>
      <section className="p-5  flex flex-col w-screen h-screen justify-evenly">
        <header>
          <strong>[SERVICES]</strong>
        </header>
        <div>
          <h2 className="font-secondary font-bold text-[5rem] sm:text-[10rem] w-100 leading-tight line-clamp-2">
            [What we do]
          </h2>
        </div>
        <ul className="flex flex-col text-2xl text-start w-1/2">
          <li>Web Development</li>
          <li>Mobile Development</li>
          <li>SEO</li>
          <li>Software Development</li>
          <li>Consulting</li>
        </ul>
        <footer>
          <p className="font-semibold text-2xl text-start w-1/2">
          Our mission is to deliver tailored websites and software solutions that
          solve real problems and drive meaningful growth.
          </p>
        </footer>
      </section>
    </>
  );
}
