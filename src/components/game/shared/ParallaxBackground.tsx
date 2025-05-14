
"use client";
// import Image from 'next/image'; // We are using background-image CSS instead
import { useEffect, useRef } from 'react';

interface ParallaxBackgroundProps {
  // parallaxOffset: number; // Removed as background scrolls independently
}

const BACKGROUND_IMAGE_URL = "url('/backgrounds/Spi Vs Spi bg.jpg')"; // Path to your background image
const AUTO_SCROLL_SPEED = 0.1; // Adjust this value for the speed of the independent auto-scroll

export function ParallaxBackground(/*{ parallaxOffset }: ParallaxBackgroundProps*/) {
  const containerRef = useRef<HTMLDivElement>(null);
  let currentPosition = 0;

  useEffect(() => {
    const container = containerRef.current;
    let animationFrameId: number;

    if (container) {
      // Set initial background properties
      container.style.backgroundImage = BACKGROUND_IMAGE_URL;
      container.style.backgroundRepeat = 'repeat-x';
      // Set background size to cover the height and auto width to maintain aspect ratio
      // and ensure the image is large enough to repeat smoothly.
      // You might need to adjust this based on the image aspect ratio and desired effect.
      container.style.backgroundSize = 'auto 100%'; // Cover the height, auto width to maintain aspect ratio

      const animateScroll = () => {
        currentPosition -= AUTO_SCROLL_SPEED; // Move background to the left
        container.style.backgroundPositionX = `${currentPosition}px`;
        animationFrameId = requestAnimationFrame(animateScroll);
      };

      animateScroll(); // Start the animation loop

      return () => {
        // Clean up the animation frame request when the component unmounts
        cancelAnimationFrame(animationFrameId);
      };
    }
    // No dependencies needed as it's auto-scrolling independently
  }, []); 

  return (
    <div ref={containerRef} className="absolute inset-0 z-[-1] opacity-20" style={{ backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x' }}>
      {/* Background image is set via CSS background-image property */}
    </div>
  );
}

    