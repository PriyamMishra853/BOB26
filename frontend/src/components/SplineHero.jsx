import React, { Suspense, lazy, useState } from 'react';
import ThreeDMedicalCanvas from './ThreeDMedicalCanvas';

const Spline = lazy(() => import('@splinetool/react-spline'));

// Public Spline community scene (interactive 3D orb/abstract shapes).
// If the scene fails to load (offline / URL retired) we gracefully fall
// back to the existing Three.js telemedicine grid canvas.
const SPLINE_SCENE_URL = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

function LoadingShimmer() {
  return (
    <div className="w-full h-[320px] sm:h-[380px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Loading interactive 3D…</span>
      </div>
    </div>
  );
}

export default function SplineHero() {
  const [failed, setFailed] = useState(false);
  // Low-end rural devices: skip the heavy WebGL Spline scene on small screens
  const [isSmallScreen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );

  if (failed || isSmallScreen) {
    return <ThreeDMedicalCanvas />;
  }

  return (
    <div className="w-full h-[320px] sm:h-[380px] rounded-lg overflow-hidden touch-none">
      <Suspense fallback={<LoadingShimmer />}>
        <Spline
          scene={SPLINE_SCENE_URL}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>
    </div>
  );
}
