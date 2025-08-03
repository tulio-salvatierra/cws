import ServicesCard from "../ServicesCard";

export default function Services() {
  return (
    <>
      <section className="flex flex-col w-screen h-auto justify-evenly mx-5 my-32">
        <div className="flex flex-col">
          <strong className="text-orange-500">[SERVICES]</strong>
          <h2 className="font-main font-black sm:text-[6rem] text-[3rem] text-zinc-700 sm:text-[6  rem] w-100 leading-tight">
            What we do
          </h2>
          <p className="font-secondary text-white text-md sm:text-md text-start w--50 sm:w-3/4">
            Our mission is to deliver tailored websites and software solutions
            that solve real problems and drive meaningful growth. We offer a
            wide range of services to help you achieve your goals.
          </p>
        </div>
        <ul className="flex flex-col">
          <li className="py-20">
            <ServicesCard />
          </li>
        </ul>
      </section>
    </>
  );
}
