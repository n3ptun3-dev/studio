
"use client";
import Image from 'next/image';
import { useEffect, useRef } from 'react';

interface ParallaxBackgroundProps {
  parallaxOffset: number;
}

const BACKGROUND_IMAGE_PATH = "/backgrounds/Spi Vs Spi bg.jpg"; // Path to your background image
const SCROLL_MULTIPLIER = 0.6; // Adjust this value for desired scroll speed relative to TOD (smaller value = slower background)
const IMAGE_WIDTH_MULTIPLIER = 1.5; // How many times wider than the viewport the image is (adjust for looping smoothness)

export function ParallaxBackground({ parallaxOffset }: ParallaxBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const image1Ref = useRef<HTMLImageElement>(null);
  const image2Ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const image1 = image1Ref.current;
    const image2 = image2Ref.current;

    if (container && image1 && image2) {
      const containerWidth = container.clientWidth;
      const totalImageWidth = containerWidth * IMAGE_WIDTH_MULTIPLIER;

      // Set the initial width of the images
      image1.style.width = `${totalImageWidth}px`;
      image2.style.width = `${totalImageWidth}px`;
      image2.style.left = `${totalImageWidth}px`; // Position the second image next to the first

      const handleScroll = () => {
        const newTranslateX = -parallaxOffset * SCROLL_MULTIPLIER;

        // Apply transform to both images
        image1.style.transform = `translateX(${newTranslateX}px)`;
        image2.style.transform = `translateX(${newTranslateX}px)`;

        // Looping logic
        if (newTranslateX <= -totalImageWidth) {
          // If the first image has scrolled completely out of view to the left, reposition it to the right of the second image
          image1.style.left = `${parseFloat(image2.style.left) + totalImageWidth}px`;
        } else if (newTranslateX >= totalImageWidth) {
          // If the second image has scrolled completely out of view to the right, reposition it to the left of the first image
           image2.style.left = `${parseFloat(image1.style.left) - totalImageWidth}px`;
        }
         if (parseFloat(image1.style.left) + newTranslateX + totalImageWidth < 0) {
           image1.style.left = `${parseFloat(image2.style.left) + totalImageWidth}px`;
         } else if (parseFloat(image2.style.left) + newTranslateX + totalImageWidth < 0) {
           image2.style.left = `${parseFloat(image1.style.left) + totalImageWidth}px`;
         }
      };

      // We don't need an event listener here, as the effect will re-run when parallaxOffset changes
      handleScroll();

    }
  }, [parallaxOffset]); // Re-run effect when parallaxOffset changes

  return (
    <div ref={containerRef} className="absolute inset-0 z-[-1] overflow-hidden">
      <Image
        ref={image1Ref}
        src={BACKGROUND_IMAGE_PATH}
        width={1920} 
        height={1080}
        alt="Stylized World Map Background"
        quality={75}
        className="absolute top-0 left-0 h-full object-cover opacity-20"
      />
       <Image
        ref={image2Ref}
        src={BACKGROUND_IMAGE_PATH}
        width={1920}
        height={1080}
        alt="Stylized World Map Background"
        quality={75}
        className="absolute top-0 h-full object-cover opacity-20"
      />
    </div>
  );
}

    