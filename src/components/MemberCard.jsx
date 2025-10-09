import React from 'react';

export function MemberCard({ member, onClick }) {
  const handleError = (e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x600/cccccc/ffffff?text=No+Image'; };
  return (
    <div className="member-card group relative parallelogram-shape cursor-pointer aspect-[2/3]" onClick={() => onClick?.(member)}>
      <div className="image-container absolute inset-0 z-[2]">
        <img
          data-src={member.avatar}
          alt={member.name}
          onError={handleError}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out lazy-image"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-[1]" />
      <div className="absolute bottom-0 left-0 w-full p-5 z-[4]">
        <h3 className="text-2xl font-bold text-white image-text-effect tracking-wide">{member.name}</h3>
        <p className="text-gray-200 image-text-effect font-medium">{member.nickname}</p>
      </div>
    </div>
  );
}
