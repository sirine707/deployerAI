
'use client';

import { useEffect, useRef } from 'react';

// Extend the Window interface to include FinisherHeader
declare global {
  interface Window {
    FinisherHeader?: new (config: any) => void;
  }
}

const FinisherHeaderClientComponent = () => {
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = 'finisher-header-script';

    const initializeFinisher = () => {
      if (window.FinisherHeader && headerRef.current) {
        // Prevent re-initialization on the same element if already done
        if (headerRef.current.dataset.finisherInitialized === 'true') {
          return;
        }
        try {
          new window.FinisherHeader({
            "count": 100,
            "size": {
              "min": 2,
              "max": 8,
              "pulse": 0
            },
            "speed": {
              "x": {
                "min": 0,
                "max": 0.4
              },
              "y": {
                "min": 0,
                "max": 0.6
              }
            },
            "colors": {
              "background": "#201e30",
              "particles": [
                "#fbfcca",
                "#d7f3fe",
                "#ffd0a7"
              ]
            },
            "blending": "overlay",
            "opacity": {
              "center": 1,
              "edge": 0
            },
            "skew": 0.3,
            "shapes": [
              "s"
            ]
          });
          headerRef.current.dataset.finisherInitialized = 'true';
        } catch (error) {
          console.error("Error initializing FinisherHeader:", error);
        }
      }
    };

    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = scriptId;
      scriptElement.src = '/finisher-header.es5.min.js'; // Assumes file is in /public directory
      scriptElement.async = true;
      scriptElement.onload = () => {
        scriptElement!.dataset.loaded = 'true';
        initializeFinisher();
      };
      scriptElement.onerror = () => {
        console.error('Failed to load finisher-header.es5.min.js');
        scriptElement!.dataset.loaded = 'false';
      };
      document.body.appendChild(scriptElement);
    } else if (scriptElement.dataset.loaded === 'true') {
      initializeFinisher(); // Script already loaded, try to initialize
    } else if (scriptElement.dataset.loaded === 'false') {
      // Script previously failed to load, do nothing or log
    } else {
      // Script tag exists, might still be loading, add listener
      scriptElement.addEventListener('load', initializeFinisher);
    }

    return () => {
      if (scriptElement) {
        scriptElement.removeEventListener('load', initializeFinisher);
      }
      // Cleanup for the specific div if necessary, e.g., if FinisherHeader added a canvas as a child
      // if (headerRef.current && headerRef.current.dataset.finisherInitialized === 'true') {
      //   // Potentially clear children if the library doesn't clean up itself
      //   // headerRef.current.innerHTML = ''; 
      // }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div
      ref={headerRef}
      className="finisher-header" // The library looks for this class
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -10, // Ensure it's behind all other content
      }}
      aria-hidden="true" // It's a decorative background
    />
  );
};

export default FinisherHeaderClientComponent;
