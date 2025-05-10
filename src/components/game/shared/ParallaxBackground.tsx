
import Image from 'next/image';

export function ParallaxBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      <Image
        src="https://picsum.photos/seed/worldmap/1920/1080" // Placeholder for stylized world map
        alt="Stylized World Map Background"
        layout="fill"
        objectFit="cover"
        quality={75}
        className="opacity-20" // Subtle, semi-transparent
        data-ai-hint="world map abstract"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-background opacity-50" />
      {/* Nebulous smoky textures - can be additional images or CSS gradients/effects */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, hsl(var(--primary-hsl) / 0.1) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, hsl(var(--secondary-hsl) / 0.08) 0%, transparent 50%)
          `,
          mixBlendMode: 'overlay', // Or 'screen' for lighter effects
        }}
      />
    </div>
  );
}

    