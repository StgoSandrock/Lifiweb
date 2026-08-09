import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "LIFI", short_name: "LIFI", description: "Liga Infantil de Fútbol Interestadios", start_url: "/", display: "standalone", background_color: "#f4f7fb", theme_color: "#071a35", icons: [{ src: "/lifi-logo.png", sizes: "200x200", type: "image/png" }] };
}
