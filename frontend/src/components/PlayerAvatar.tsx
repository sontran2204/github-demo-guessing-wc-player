import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getOptimizedImageUrl, preloadImage } from "../lib/imageCache";

interface PlayerAvatarProps {
  name: string;
  imageUrl: string | null;
  size?: "md" | "lg" | "xl";
  zoomable?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export function PlayerAvatar({
  name,
  imageUrl,
  size = "lg",
  zoomable = true,
}: PlayerAvatarProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const isHero = size === "xl";

  const displayUrl = useMemo(() => getOptimizedImageUrl(imageUrl), [imageUrl]);
  const showPhoto = !!displayUrl && !failed;
  const canZoom = zoomable && showPhoto && loaded;

  const frameClasses = isHero
    ? "w-52 h-72 sm:w-64 sm:h-80 rounded-3xl"
    : size === "lg"
      ? "w-32 h-32 sm:w-40 sm:h-40 rounded-full"
      : "w-20 h-20 rounded-full";

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setScale(1);
  }, []);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(MAX_ZOOM, s + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(MIN_ZOOM, s - ZOOM_STEP));
  }, []);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    if (!displayUrl) return;

    let cancelled = false;
    preloadImage(displayUrl).then((ok) => {
      if (cancelled) return;
      if (ok) setLoaded(true);
      else setFailed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [displayUrl]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen, closeLightbox, zoomIn, zoomOut]);

  return (
    <>
      <div className={`relative mx-auto ${isHero ? "w-52 sm:w-64" : ""}`}>
        <button
          type="button"
          onClick={() => canZoom && setLightboxOpen(true)}
          disabled={!canZoom}
          className={`relative block mx-auto ${canZoom ? "cursor-zoom-in" : "cursor-default"}`}
          aria-label={canZoom ? `Zoom in on ${name}` : name}
        >
          <div
            className={`${frameClasses} relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 ring-4 ring-emerald-400/40 shadow-2xl flex items-center justify-center`}
          >
            <span
              className={`font-bold text-emerald-400/90 select-none transition-opacity duration-200 ${
                isHero ? "text-5xl" : size === "lg" ? "text-3xl" : "text-xl"
              } ${loaded && showPhoto ? "opacity-0" : "opacity-100"}`}
              aria-hidden={loaded && showPhoto}
            >
              {getInitials(name) || "⚽"}
            </span>

            {showPhoto && loaded && (
              <img
                src={displayUrl}
                alt={name}
                decoding="async"
                fetchPriority={isHero ? "high" : "auto"}
                className={`absolute inset-0 h-full w-full object-cover object-top ${isHero ? "" : "rounded-full"}`}
              />
            )}
          </div>

          {canZoom && (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Tap to zoom
            </span>
          )}
        </button>
      </div>

      {lightboxOpen && imageUrl && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photo`}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 shrink-0">
            <p className="truncate text-sm font-medium text-white">{name}</p>
            <div className="flex items-center gap-1">
              <ZoomButton onClick={zoomOut} disabled={scale <= MIN_ZOOM} label="Zoom out">
                −
              </ZoomButton>
              <span className="min-w-[3rem] text-center text-xs text-slate-300">
                {Math.round(scale * 100)}%
              </span>
              <ZoomButton onClick={zoomIn} disabled={scale >= MAX_ZOOM} label="Zoom in">
                +
              </ZoomButton>
              <button
                type="button"
                onClick={closeLightbox}
                className="ml-2 rounded-lg bg-slate-700/80 px-3 py-2 text-sm font-medium text-white hover:bg-slate-600"
                aria-label="Close"
              >
                Close
              </button>
            </div>
          </div>

          <div
            className="flex-1 overflow-auto flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeLightbox()}
            onWheel={(e) => {
              e.preventDefault();
              if (e.deltaY < 0) zoomIn();
              else zoomOut();
            }}
          >
            <img
              src={imageUrl}
              alt={name}
              draggable={false}
              style={{ transform: `scale(${scale})` }}
              className="max-h-[75vh] max-w-[min(90vw,480px)] w-auto h-auto object-contain rounded-2xl shadow-2xl transition-transform duration-150 select-none"
            />
          </div>
        </div>
      )}
    </>
  );
}

function ZoomButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700/80 text-lg font-bold text-white hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
