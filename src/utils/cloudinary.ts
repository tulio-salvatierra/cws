/** Injects Cloudinary transforms after `/upload/`, replacing any existing ones. */
export function withCloudinaryTransforms(
  src: string,
  transforms: string,
): string {
  const marker = "/upload/";
  const index = src.indexOf(marker);
  if (index === -1) return src;

  const prefix = src.slice(0, index + marker.length);
  let rest = src.slice(index + marker.length);

  // Drop an existing transform segment (e.g. f_auto,q_auto/), keep version + public id.
  if (!/^v\d+\//.test(rest)) {
    const slash = rest.indexOf("/");
    if (slash !== -1) {
      const first = rest.slice(0, slash);
      if (first.includes(",") || /[a-z]_/.test(first)) {
        rest = rest.slice(slash + 1);
      }
    }
  }

  return `${prefix}${transforms}/${rest}`;
}

/** Preview-sized delivery for the Services panel (~2x max CSS width). */
export function servicesPreviewSrc(src: string): string {
  return withCloudinaryTransforms(
    src,
    "f_auto,q_auto,w_900,c_fill,g_auto,ar_3:4",
  );
}
