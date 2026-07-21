import { useState, useCallback, useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { galleryImages, GalleryImage } from "./galleryData";
import "./Gallery.css";

gsap.registerPlugin(useGSAP, Observer);

export default function Gallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lightboxOpenRef = useRef(false);

  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const openLightbox = useCallback((image: GalleryImage, index: number) => {
    setSelectedImage(image);
    setSelectedIndex(index);
    lightboxOpenRef.current = true;
    document.body.style.overflow = "hidden";
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedImage(null);
    setSelectedIndex(-1);
    lightboxOpenRef.current = false;
    document.body.style.overflow = "";
  }, []);

  const goToPrevious = useCallback(() => {
    const newIndex =
      selectedIndex > 0 ? selectedIndex - 1 : galleryImages.length - 1;
    setSelectedIndex(newIndex);
    setSelectedImage(galleryImages[newIndex]);
  }, [selectedIndex]);

  const goToNext = useCallback(() => {
    const newIndex =
      selectedIndex < galleryImages.length - 1 ? selectedIndex + 1 : 0;
    setSelectedIndex(newIndex);
    setSelectedImage(galleryImages[newIndex]);
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;

      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, closeLightbox, goToPrevious, goToNext]);

  useGSAP(
    () => {
      const content = contentRef.current;
      const container = containerRef.current;
      if (!content || !container) return;

      let incrTick = 0;
      let interactionTimeout: ReturnType<typeof setTimeout> | undefined;
      let half = content.getBoundingClientRect().height / 2;
      let wrap = gsap.utils.wrap(-half, 0);

      const refreshWrap = () => {
        half = content.getBoundingClientRect().height / 2;
        wrap = gsap.utils.wrap(-half, 0);
      };

      const yTo = gsap.quickTo(content, "y", {
        duration: 1,
        ease: "power4",
        modifiers: {
          y: (value) => gsap.utils.unitize(wrap)(value),
        },
      });

      const scaleTo = gsap.quickTo(container, "scaleY", {
        duration: 0.6,
        ease: "power4",
      });

      const handleInteraction = (e: Observer) => {
        if (lightboxOpenRef.current) return;

        if (e.event.type === "wheel") incrTick -= e.deltaY;
        else incrTick += e.deltaY;

        const valSc = 1 - gsap.utils.clamp(-0.2, 0.2, e.deltaY / 300);
        scaleTo(valSc);

        window.clearTimeout(interactionTimeout);
        interactionTimeout = setTimeout(() => {
          scaleTo(1);
        }, 66);
      };

      const observer = Observer.create({
        target: window,
        type: "wheel,pointer,touch",
        onChange: handleInteraction,
      });

      const tick = (_time: number, dt: number) => {
        if (lightboxOpenRef.current) return;
        incrTick += dt / 30;
        yTo(incrTick);
      };

      gsap.ticker.add(tick);

      const images = content.querySelectorAll("img");
      images.forEach((img) => {
        if (img.complete) refreshWrap();
        else img.addEventListener("load", refreshWrap, { once: true });
      });

      window.addEventListener("resize", refreshWrap);

      return () => {
        observer.kill();
        gsap.ticker.remove(tick);
        window.clearTimeout(interactionTimeout);
        window.removeEventListener("resize", refreshWrap);
      };
    },
    { scope: sectionRef, dependencies: [galleryImages.length] },
  );

  const mediaItems = [...galleryImages, ...galleryImages];

  return (
    <>
      <section ref={sectionRef} className="mwg_effect019">
        <div className="texts">
          <span className="span1">PHOTO</span>
          <span className="span2">GRAPHY</span>
          <span className="span3">
            <span>WORKS</span>
            <span></span>
          </span>
          <span className="span4"></span>
        </div>

        <div ref={containerRef} className="container">
          <div ref={contentRef} className="content">
            {mediaItems.map((image, index) => {
              const sourceIndex = index % galleryImages.length;

              return (
                <div className="media" key={`${image.id}-${index}`}>
                  <button
                    type="button"
                    className="media__trigger"
                    onClick={() => openLightbox(image, sourceIndex)}
                    aria-label={`View ${image.alt}`}
                  >
                    <img src={image.src} alt={image.alt} loading="lazy" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {selectedImage && (
        <div className="lightbox" onClick={closeLightbox}>
          <button
            className="lightbox__close"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          <button
            className="lightbox__nav lightbox__nav--prev"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            aria-label="Previous image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <div
            className="lightbox__content"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="lightbox__image"
            />
            {selectedImage.title && (
              <div className="lightbox__caption">
                <p className="lightbox__title">{selectedImage.title}</p>
                {selectedImage.category && (
                  <span className="lightbox__category">
                    {selectedImage.category}
                  </span>
                )}
              </div>
            )}
            <div className="lightbox__counter">
              {selectedIndex + 1} / {galleryImages.length}
            </div>
          </div>

          <button
            className="lightbox__nav lightbox__nav--next"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="Next image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
