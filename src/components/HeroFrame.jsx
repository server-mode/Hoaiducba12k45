import React from 'react';
import { usePaneRotator } from '../hooks/usePaneRotator';

const defaultImages = [
  '/DMT_0001.jpg','/DMT_0426.jpg','/DMT_9823.jpg','/DVN04905.jpg','/DVN04915.jpg','/DVN06150.jpg'
];

export function HeroFrame({ text = 'A12K45', images = defaultImages }) {
  usePaneRotator(images, 6000);
  const chars = text.split('');
  return (
    <div className="hero-frame" aria-hidden="false">
      {chars.map((ch, i) => (
        <div key={i} className="pane" data-pane={i+1} style={{ ['--pane-img-inline']: `url('${images[i % images.length]}')` }}>
          <span className="pane-char">{ch}</span>
          <div className="pane-flash" />
        </div>
      ))}
    </div>
  );
}
