"use client";

import { useState } from "react";

type BannerSlide = {
  id: string;
  background: string;
};

const slides: BannerSlide[] = [
  { id: "banner-1", background: "#d9d1d0" },
  { id: "banner-2", background: "#d9d0f9" },
  { id: "banner-3", background: "#d9f9d2" },
];

export default function Banner() {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToPrevious = () => {
    setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  const getSlide = (offset: number) => {
    return slides[(activeIndex + offset + slides.length) % slides.length];
  };

  const visibleSlides = [
    { slide: getSlide(-1), className: "w-[17%] shrink-0" },
    { slide: getSlide(0), className: "min-w-0 flex-1" },
    { slide: getSlide(1), className: "w-[17%] shrink-0" },
  ];

  return (
    <section className="relative mt-10 h-[220px] w-full overflow-hidden  bg-white sm:h-64 lg:h-[330px]" aria-label="Banner promo" aria-roledescription="carousel">
      <div className="flex h-full w-full gap-4">
        {visibleSlides.map(({ slide, className }) => (
          <div key={slide.id} className={`${className} h-full rounded-[10px] transition-colors duration-300`} style={{ backgroundColor: slide.background }} />
        ))}
      </div>

      <button type="button" onClick={goToPrevious} className="absolute left-[calc(17%+8px)] top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-sm transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#68247B] focus:ring-offset-2" aria-label="Banner sebelumnya">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button type="button" onClick={goToNext} className="absolute right-[calc(17%+8px)] top-1/2 grid h-9 w-9 translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-black shadow-sm transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#68247B] focus:ring-offset-2" aria-label="Banner berikutnya">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  );
}
