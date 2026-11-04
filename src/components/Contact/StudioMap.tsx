const EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2967.3016444358614!2d-87.75334668753932!3d41.950855560734496!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880fcde85586be3d%3A0x88f84b57cb03f35b!2sCicero%20Web%20Studio%20LLC!5e0!3m2!1ses!2sus!4v1793810786331!5m2!1ses!2sus";

export default function StudioMap() {
  return (
    <iframe
      src={EMBED_SRC}
      width="100%"
      height="100%"
      style={{ border: 0, minHeight: "20rem" }}
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      title="Cicero Web Studio location"
      className="h-full min-h-[20rem] w-full rounded-xl"
    />
  );
}
