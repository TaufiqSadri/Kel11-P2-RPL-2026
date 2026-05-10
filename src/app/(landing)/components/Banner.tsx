"use client";

import { useState, useEffect, useCallback } from "react";
import type { Iklan } from "@/types/database";

// Warna fallback kalau belum ada iklan di DB
const FALLBACK_SLIDES = [
  { id: "fallback-1", background: "#d9d1d0" },
  { id: "fallback-2", background: "#d9d0f9" },
  { id: "fallback-3", background: "#d9f9d2" },
];

const AUTO_PLAY_INTERVAL = 5000 // 5 detik

interface Props {
  iklans?: Iklan[]
}

export default function Banner({ iklans = [] }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const hasImages = iklans.length > 0

  // Normalise: pakai iklan dari DB kalau ada, fallback ke warna solid
  const slides = hasImages
    ? iklans.map((iklan) => ({
        id: iklan.id,
        imageUrl: iklan.image_url,
        judul: iklan.judul,
        linkUrl: iklan.link_url,
        background: undefined as string | undefined,
      }))
    : FALLBACK_SLIDES.map((s) => ({
        id: s.id,
        imageUrl: undefined as string | undefined,
        judul: undefined as string | undefined,
        linkUrl: undefined as string | undefined,
        background: s.background,
      }))

  const total = slides.length

  const goToPrevious = useCallback(() => {
    setActiveIndex((curr) => (curr === 0 ? total - 1 : curr - 1))
  }, [total])

  const goToNext = useCallback(() => {
    setActiveIndex((curr) => (curr + 1) % total)
  }, [total])

  // Auto-play
  useEffect(() => {
    if (isHovered || total <= 1) return
    const timer = setInterval(goToNext, AUTO_PLAY_INTERVAL)
    return () => clearInterval(timer)
  }, [goToNext, isHovered, total])

  const getSlide = (offset: number) =>
    slides[(activeIndex + offset + total) % total]

  const visibleSlides = [
    { slide: getSlide(-1), className: "w-[17%] shrink-0" },
    { slide: getSlide(0),  className: "min-w-0 flex-1" },
    { slide: getSlide(1),  className: "w-[17%] shrink-0" },
  ]

  return (
    <section
      className="relative mt-10 h-[220px] w-full overflow-hidden bg-white sm:h-64 lg:h-[330px]"
      aria-label="Banner iklan"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex h-full w-full gap-4">
        {visibleSlides.map(({ slide, className }, idx) => {
          const isCenter = idx === 1
          const content = slide.linkUrl && isCenter ? (
            <a
              href={slide.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full w-full"
              aria-label={slide.judul ?? 'Iklan banner'}
            >
              {slide.imageUrl ? (
                <img
                  src={slide.imageUrl}
                  alt={slide.judul ?? 'Banner iklan'}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : null}
            </a>
          ) : slide.imageUrl ? (
            <img
              src={slide.imageUrl}
              alt={slide.judul ?? 'Banner iklan'}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : null

          return (
            <div
              key={`${slide.id}-${idx}`}
              className={`${className} h-full overflow-hidden rounded-[10px] transition-all duration-300`}
              style={slide.background ? { backgroundColor: slide.background } : undefined}
            >
              {content}
            </div>
          )
        })}
      </div>

      {/* Tombol Prev */}
      {total > 1 && (
        <button
          type="button"
          onClick={goToPrevious}
          className="absolute left-[calc(17%+8px)] top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-sm transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#68247B] focus:ring-offset-2"
          aria-label="Banner sebelumnya"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Tombol Next */}
      {total > 1 && (
        <button
          type="button"
          onClick={goToNext}
          className="absolute right-[calc(17%+8px)] top-1/2 grid h-9 w-9 translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-sm transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#68247B] focus:ring-offset-2"
          aria-label="Banner berikutnya"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" role="tablist" aria-label="Slide banner">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setActiveIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
