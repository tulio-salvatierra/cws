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
        <ul className="flex flex-col text-2xl text-start sm:w-1/2 w-100">
          <li>[01] Web Development</li>
          <li>[02] Mobile Development</li>
          <li>[03] SEO</li>
          <li>[04] Software Development</li>
          <li>[05] Consulting</li>
        </ul>
        <footer>
          <p className="font-normal text-lg text-start w-3/4">
          Our mission is to deliver tailored websites and software solutions that
          solve real problems and drive meaningful growth.
          </p>
        </footer>
      </section>
    </>
  );
}
