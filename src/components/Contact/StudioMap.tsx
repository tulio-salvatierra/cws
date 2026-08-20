import { useEffect, useState } from "react";

const STUDIO_LAT = 41.95077474768748;
const STUDIO_LNG = -87.7509307390869;
const STUDIO_CENTER = `${STUDIO_LAT},${STUDIO_LNG}`;
const SCRIPT_ATTR = "data-google-maps-js";
const EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d252.5880090363163!2d-87.7509307390869!3d41.95077474768748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880fcde85586be3d%3A0x88f84b57cb03f35b!2sCicero%20Web%20Studio!5e1!3m2!1sen!2sus!4v1761046047715!5m2!1sen!2sus";

function getMapsApiKey() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return typeof key === "string" && key.trim().length > 0 ? key.trim() : "";
}

function loadMapsJavascript(apiKey: string): Promise<void> {
  const googleMaps = window.google?.maps;
  if (googleMaps?.importLibrary) {
    return Promise.all([
      googleMaps.importLibrary("maps"),
      googleMaps.importLibrary("marker"),
    ]).then(() => undefined);
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[${SCRIPT_ATTR}]`,
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Maps JS failed")), {
        once: true,
      });
    }).then(() =>
      Promise.all([
        window.google.maps.importLibrary("maps"),
        window.google.maps.importLibrary("marker"),
      ]).then(() => undefined),
    );
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.setAttribute(SCRIPT_ATTR, "true");
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey,
    )}&libraries=maps,marker&v=weekly&loading=async`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Maps JS failed"));
    document.head.appendChild(script);
  }).then(() =>
    Promise.all([
      window.google.maps.importLibrary("maps"),
      window.google.maps.importLibrary("marker"),
    ]).then(() => undefined),
  );
}

function EmbedFallback() {
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

export default function StudioMap() {
  const apiKey = getMapsApiKey();
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!apiKey);

  useEffect(() => {
    if (!apiKey) return undefined;

    let cancelled = false;
    loadMapsJavascript(apiKey)
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  if (failed || !ready) {
    if (failed) return <EmbedFallback />;
    return (
      <div
        className="min-h-[20rem] w-full rounded-xl bg-zinc-900/40"
        aria-hidden
      />
    );
  }

  return (
    <gmp-map
      center={STUDIO_CENTER}
      zoom="15"
      map-id={mapId}
      style={{ display: "block", width: "100%", height: "100%", minHeight: "20rem" }}
    >
      <gmp-advanced-marker
        position={STUDIO_CENTER}
        title="Cicero Web Studio"
      />
    </gmp-map>
  );
}
