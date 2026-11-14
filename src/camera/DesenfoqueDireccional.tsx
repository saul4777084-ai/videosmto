import React, {useId} from 'react';
import {AbsoluteFill} from 'remotion';

/**
 * Desenfoque direccional real mediante un filtro SVG (feGaussianBlur con
 * desviación distinta en X y en Y). Se usa para barridos y transiciones.
 */
export const DesenfoqueDireccional: React.FC<{sx: number; sy: number; children: React.ReactNode}> = ({sx, sy, children}) => {
  const id = 'dd' + useId().replace(/[^a-zA-Z0-9]/g, '');
  if (sx < 0.3 && sy < 0.3) return <>{children}</>;
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${sx.toFixed(2)} ${sy.toFixed(2)}`} edgeMode="duplicate" />
        </filter>
      </svg>
      <AbsoluteFill style={{filter: `url(#${id})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
