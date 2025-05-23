
"use client";
// import Image from 'next/image'; // We are using background-image CSS instead

const BACKGROUND_IMAGE_URL = "url('/backgrounds/Spi Vs Spi bg.jpg')"; // Path to your background image

export function ParallaxBackground() {
  return (
    <div className="parallax-background absolute inset-0 z-[-1] opacity-20" style={{ backgroundImage: BACKGROUND_IMAGE_URL, backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x' }}>
      {/* Background image is set via CSS background-image property */}
    </div>
  );
}

    