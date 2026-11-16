import { useEffect, useRef, useState } from "react";
import { HERO_MEDIA } from "../heroMedia.js";

const motionQuery = "(prefers-reduced-motion: reduce)";

export default function HeroMedia() {
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(motionQuery).matches
      : false,
  );
  const [finished, setFinished] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const preference = window.matchMedia(motionQuery);
    const update = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) setFinished(true);
    };
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let active = true;
    video.muted = true;
    video.play().catch(() => {
      if (active) setFinished(true);
    });
    return () => {
      active = false;
      video.pause();
    };
  }, [reducedMotion, finished]);

  return (
    <div
      className="hero-motion"
      data-playback={finished || reducedMotion ? "still" : "video"}
    >
      <img
        src={HERO_MEDIA.last}
        alt="A black Mitsubishi Lancer Evolution on a mountain road in Initial D"
        width="498"
        height="278"
        fetchPriority="high"
      />
      {!reducedMotion && !finished && (
        <video
          ref={videoRef}
          src={HERO_MEDIA.video}
          poster={HERO_MEDIA.first}
          autoPlay
          muted
          playsInline
          preload="auto"
          width="498"
          height="278"
          aria-hidden="true"
          onEnded={() => setFinished(true)}
          onError={() => setFinished(true)}
        />
      )}
    </div>
  );
}
