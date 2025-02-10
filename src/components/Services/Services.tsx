export default function Services() {
  return (
    <>
      <section className="p-5  flex flex-col w-screen h-screen justify-evenly">
        <div className="flex flex-col">
          <strong className="text-white">[SERVICES]</strong>
          <h2 className="font-main font-black sm:text-[6rem] text-[3rem] text-zinc-700 sm:text-[6  rem] w-100 leading-tight">
            What we do
          </h2>
          <p className="font-normal text-4xl text-start w-3/4">
            Our mission is to deliver tailored websites and software solutions
            that solve real problems and drive meaningful growth. We offer a
            wide range of services to help you achieve your goals.
          </p>
        </div>
        <ul className="flex flex-col text-2xl text-start sm:w-1/2 w-100">
        <li className="font-secondary text-xl sm:text-2xl p-4">[01] Web Development</li>
          <li className="font-secondary text-xl sm:text-2xl p-4">[02] Mobile Development</li>
          <li className="font-secondary text-xl sm:text-2xl p-4">[03] SEO</li>
          <li className="font-secondary text-xl sm:text-2xl p-4">[04] Software Development</li>
          <li className="font-secondary text-xl sm:text-2xl p-4">[05] Consulting</li>
        </ul>
      </section>
    </>
  );
}
