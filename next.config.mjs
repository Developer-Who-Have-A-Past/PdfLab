// BASE_PATH is set only for GitHub Pages project sites (e.g. /coolbase).
// Leave it empty for local dev, Capacitor (Android) and Electron (Windows).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Static export so the same build runs on the web, inside Capacitor and inside Electron. */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
};
export default nextConfig;
