export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title?: string;
  category?: string;
}

export const galleryImages: GalleryImage[] = [
  {
    id: "1",
    src: "https://res.cloudinary.com/cbae9m8e/image/upload/f_auto,q_auto/DSC03784_qlwamq",
    alt: "Photography work 1",
    title: "DSC03784",
    category: "Photography",
  },
];
