"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    image: "/images/hero/retail-customers.png",
    eyebrow: "Quality meats for every table",
    title: "Quality Meats for Everyday Meals",
    copy: "Premium frozen meats, everyday cuts, and family-ready food products for delicious meals at home.",
    primaryHref: "/retail",
    primaryLabel: "Shop Retail Products"
  },
  {
    image: "/images/hero/wholesale-customers.png",
    eyebrow: "Reliable supply for local food businesses",
    title: "Reliable Supply for Local Food Businesses",
    copy: "Box pricing and dependable inventory for carinderias, food stalls, caterers, and small restaurants.",
    primaryHref: "/contact",
    primaryLabel: "Request Wholesale Pricing"
  },
  {
    image: "/images/hero/resellers.png",
    eyebrow: "Build your business with Parrilla",
    title: "Build Your Business with Parrilla",
    copy: "Frozen goods and packed meats for neighborhood sellers and repeat business customers.",
    primaryHref: "/reseller",
    primaryLabel: "Become a Reseller"
  },
  {
    image: "/images/hero/meal-inspirations.png",
    eyebrow: "From our freezer to your family table",
    title: "Endless Meal Possibilities",
    copy: "Adobo, sinigang, sisig, nilaga, chicken afritada, and grilled steak ideas for family meals and special occasions.",
    primaryHref: "/retail",
    primaryLabel: "Browse Products"
  }
];

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const activeSlide = slides[activeIndex];

  function goToSlide(index) {
    setActiveIndex((index + slides.length) % slides.length);
  }

  useEffect(() => {
    if (isPaused) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <section
      className="hero-shop"
      aria-label="Parrilla Meat Shop highlights"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="hero-media" aria-hidden="true">
        {slides.map((slide, index) => (
          <img
            key={slide.image}
            className={index === activeIndex ? "active" : ""}
            src={slide.image}
            alt=""
          />
        ))}
      </div>
      <div className="hero-content">
        <p className="eyebrow">{activeSlide.eyebrow}</p>
        <h1>{activeSlide.title}</h1>
        <p>{activeSlide.copy}</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href={activeSlide.primaryHref}>
            {activeSlide.primaryLabel}
          </Link>
          <Link className="btn btn-secondary hero-secondary" href="/contact">
            Contact Us
          </Link>
        </div>
      </div>
      <button
        className="hero-arrow hero-arrow-prev"
        type="button"
        onClick={() => goToSlide(activeIndex - 1)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
        aria-label="Previous slide"
      >
        <span aria-hidden="true">‹</span>
      </button>
      <button
        className="hero-arrow hero-arrow-next"
        type="button"
        onClick={() => goToSlide(activeIndex + 1)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
        aria-label="Next slide"
      >
        <span aria-hidden="true">›</span>
      </button>
      <div className="hero-carousel-controls" aria-label="Hero carousel slide selector">
        <div className="hero-indicators">
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              className={index === activeIndex ? "active" : ""}
              type="button"
              onClick={() => goToSlide(index)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              aria-label={`Show slide ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
