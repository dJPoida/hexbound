import { useEffect, useState } from 'preact/hooks';

export enum ScreenSize {
  MOBILE = 'mobile', // < 768px
  TABLET = 'tablet', // 768px - 1023px
  DESKTOP = 'desktop', // >= 1024px
}

export function useResponsive() {
  const [screenSize, setScreenSize] = useState<ScreenSize>(ScreenSize.DESKTOP);

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize(ScreenSize.MOBILE);
      } else if (width < 1024) {
        setScreenSize(ScreenSize.TABLET);
      } else {
        setScreenSize(ScreenSize.DESKTOP);
      }
    };

    // Set initial size
    updateScreenSize();

    // Add event listener
    window.addEventListener('resize', updateScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return {
    screenSize,
    isMobile: screenSize === ScreenSize.MOBILE,
    isTablet: screenSize === ScreenSize.TABLET,
    isDesktop: screenSize === ScreenSize.DESKTOP,
  };
}
