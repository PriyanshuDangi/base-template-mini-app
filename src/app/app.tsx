"use client";

import dynamic from "next/dynamic";
import { APP_NAME } from "~/lib/constants";

// note: dynamic import is required for components that use the Frame SDK
const SmashKarts = dynamic(() => import("~/components/SmashKarts"), {
  ssr: false,
});

export default function App(
  { title }: { title?: string } = { title: APP_NAME }
) {
  return <SmashKarts />;
}

// export default function App(
//   { title }: { title?: string } = { title: APP_NAME }
// ) {
//   return (
//     <div style={{ position: "fixed", inset: 0 }}>
//       <iframe
//         src="https://smashkarts.io/"
//         title={title}
//         style={{ border: 0, width: "100%", height: "100%" }}
//         allow="fullscreen; gamepad; accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; camera; microphone; geolocation; xr-spatial-tracking"
//         allowFullScreen
//         loading="eager"
//         referrerPolicy="no-referrer-when-downgrade"
//       />
//     </div>
//   );
// }