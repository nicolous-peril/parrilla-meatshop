"use client";

import Link from "next/link";
import { useState } from "react";

const slides = [
  {
    image: "/images/hero/retail-customers.png",
    eyebrow: "Quality meats for every table",
    title: "Parrilla Meat Shop",
    copy: "Premium frozen meats, everyday cuts, and family-ready food supply from Alfonso, Cavite.",
    primaryHref: "/retail",
    primaryLabel: "Shop Retail"
  },
  {
    image: "/images/hero/wholesale-customers.png",
    eyebrow: "Reliable supply for local food businesses",
    title: "Bulk Meat Supply",
    copy: "Box pricing and dependable inventory for carinderias, food stalls, caterers, and small restaurants.",
    primaryHref: "/wholesale",
    primaryLabel: "Shop Wholesale"
  },
  {
    image: "/images/hero/resellers.png",
    eyebrow: "Build your business with Parrilla",
    title: "Reseller-Ready Products",
    copy: "Frozen goods and packed meats for neighborhood sellers and repeat business customers.",
    primaryHref: "/reseller",
    primaryLabel: "Shop Reseller"
  },
  {
    image: "/images/hero/meal-inspirations.png",
    eyebrow: "From our freezer to your family table",
    title: "Meals Made Easier",
    copy: "Steak, barbecue, adobo, sinigang, and samgyupsal inspirations for real Filipino gatherings.",
    primaryHref: "/retail",
    primaryLabel: "Find Products"
  }
];

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];

  function goToSlide(index) {
    setActiveIndex((index + slides.length) % slides.length);
  }

  return (
    <section className="hero-shop" aria-label="Parrilla Meat Shop highlights">
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
      <div className="hero-carousel-controls" aria-label="Hero carousel controls">
        <button type="button" onClick={() => goToSlide(activeIndex - 1)} aria-label="Previous slide">
          ‹
        </button>
        <div className="hero-indicators">
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              className={index === activeIndex ? "active" : ""}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Show slide ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
        <button type="button" onClick={() => goToSlide(activeIndex + 1)} aria-label="Next slide">
          ›
        </button>
      </div>
    </section>
  );
}
