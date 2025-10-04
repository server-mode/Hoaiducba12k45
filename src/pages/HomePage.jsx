import React, { useState } from 'react';
import { HeroFrame } from '../components/HeroFrame';
import { IntroModal } from '../components/IntroModal.jsx';
import { usePosts } from '../context/PostContext.jsx';
import { PostComposer } from '../components/PostComposer.jsx';
import { PostList } from '../components/PostItem.jsx';

export function HomePage(){
  const [open, setOpen] = useState(false);
  const [heroCollapsed, setHeroCollapsed] = useState(false);
  const { posts } = usePosts();
  const ordered = [...posts].sort((a,b)=> b.createdAt - a.createdAt);
  return (
    <>
  <div className={`hero-block ${heroCollapsed ? 'collapsed' : ''} relative overflow-hidden transition-all duration-300 ${heroCollapsed ? 'h-[200px]' : 'h-[520px]'}`}>
        {/* Gradient / image background layer */}
        <div className="absolute inset-0 -z-10 pointer-events-none bg-gradient-to-b from-indigo-700 via-sky-600/80 to-transparent dark:from-slate-800 dark:via-slate-800/90 dark:to-transparent" />
  <div className={`container mx-auto px-6 ${heroCollapsed ? 'py-8' : 'py-24'} text-center relative z-[1] select-none transition-all duration-300`}>
          <HeroFrame text="A12K45" />
          <p className="mt-14 md:mt-20 text-2xl md:text-3xl font-semibold text-white drop-shadow-lg">Trường THPT Hoài Đức B</p>
          <p className="mt-8 md:mt-10 text-xl md:text-2xl text-white font-medium tracking-wide" id="classSlogan">Niên khóa 2022 - 2025</p>
        </div>
        <div className="absolute left-1/2 bottom-2 md:bottom-4 -translate-x-1/2 z-10">
          <button onClick={()=> setHeroCollapsed(c=>!c)} className="w-12 h-12 rounded-full shadow-xl bg-white/90 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:scale-105 active:scale-95 transition group" aria-label="Toggle hero">
            <svg className={`w-6 h-6 text-gray-700 dark:text-gray-200 transition-transform duration-500 ${heroCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>
        </div>
      </div>
      <main className="relative container mx-auto px-6 pt-10 pb-16 max-w-4xl">
        <div className="space-y-6 bg-transparent">
          <PostComposer />
          <PostList posts={ordered} />
        </div>
      </main>
      <IntroModal open={open} onClose={()=>setOpen(false)} />
    </>
  );
}
