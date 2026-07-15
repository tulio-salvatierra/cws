import { useState, useCallback, useEffect } from "react";
import { galleryImages, GalleryImage } from "./galleryData";
import "./Gallery.css";

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const openLightbox = useCallback((image: GalleryImage, index: number) => {
    setSelectedImage(image);
    setSelectedIndex(index);
    document.body.style.overflow = "hidden";
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedImage(null);
    setSelectedIndex(-1);
    document.body.style.overflow = "";
  }, []);

  const goToPrevious = useCallback(() => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : galleryImages.length - 1;
    setSelectedIndex(newIndex);
    setSelectedImage(galleryImages[newIndex]);
  }, [selectedIndex]);

  const goToNext = useCallback(() => {
    const newIndex = selectedIndex < galleryImages.length - 1 ? selectedIndex + 1 : 0;
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

  return (
    <>
      <section className="gallery-section">
        <div className="gallery-container">
          <header className="gallery-header">
            <h1 className="gallery-title">Photography</h1>
            <p className="gallery-subtitle">
              A collection of moments captured through the lens
            </p>
          </header>

          <div className="gallery-grid">
            {galleryImages.map((image, index) => (
              <button
                key={image.id}
                className="gallery-item"
                onClick={() => openLightbox(image, index)}
                aria-label={`View ${image.alt}`}
              >
                <div className="gallery-item__image-wrapper">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="gallery-item__image"
                    loading="lazy"
                  />
                  <div className="gallery-item__overlay">
                    <span className="gallery-item__icon">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                        <path d="M11 8v6" />
                        <path d="M8 11h6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>
            ))}
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
                  <span className="lightbox__category">{selectedImage.category}</span>
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
