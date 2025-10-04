import React, { useEffect } from 'react';
import { MemberCard } from './MemberCard';

export function MemberGrid({ members = [], onSelect }) {
  useEffect(() => {
    // Lazy loading & intersection
    const imgs = document.querySelectorAll('img.lazy-image');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if(src){ img.src = src; }
          img.onload = () => { img.classList.add('loaded'); img.parentElement?.classList.add('loaded'); };
          observer.unobserve(img);
        }
      });
    }, { rootMargin:'100px 0px', threshold:0.1 });
    imgs.forEach(i => imageObserver.observe(i));

    const cards = document.querySelectorAll('.member-card');
    const cardObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const card = entry.target;
        if(entry.isIntersecting){
          const delay = Math.random() * 200;
            setTimeout(()=> card.classList.add('visible'), delay);
        } else {
          card.classList.remove('visible');
        }
      });
    }, { rootMargin: '0px 0px -50px 0px', threshold:0.2 });
    cards.forEach(c => cardObserver.observe(c));

    return () => { imageObserver.disconnect(); cardObserver.disconnect(); };
  }, [members]);

  // De-duplicate by id/email and generate stable unique key fallback
  const deduped = React.useMemo(()=>{
    const seen = new Set();
    const out = [];
    (members||[]).forEach((m, idx) => {
      const base = m?.id || m?.email || `idx-${idx}`;
      if(seen.has(base)) return; // skip duplicate
      seen.add(base);
      out.push(m);
    });
    return out;
  }, [members]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {deduped.map((m, idx) => {
        const key = m?.id ? `mem-${m.id}` : m?.email ? `mem-${m.email}` : `mem-fallback-${idx}`;
        return <MemberCard key={key} member={m} onClick={onSelect} />;
      })}
    </div>
  );
}
