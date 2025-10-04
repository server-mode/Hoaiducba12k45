import React, { useEffect, useState, useCallback } from 'react';
import { HeroFrame } from '../components/HeroFrame';
import { classInfo, members } from '../data/classData';

// Counter component animation similar to script in thanhtich.html
function AnimatedCounter({ target, delayFirst = false }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame; let start;
    const duration = delayFirst ? 1400 : 1000;
    function step(ts){
      if(!start) start = ts;
      const elapsed = Math.min(ts - start, duration);
      const progress = elapsed / duration;
      const current = Math.round(target * progress);
      setValue(current);
      if(elapsed < duration) frame = requestAnimationFrame(step); else setValue(target);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, delayFirst]);
  return <div className="text-4xl font-extrabold text-green-600">{value}%</div>;
}

// Replicated Top 3 config (ids & hover scores) from scripts2.js mapping
// rankLabels {2:'Top 1',33:'Top 2',35:'Top 3'}
// Swapped display order of Top 1 & Top 2 members
const TOP3_IDS = [33,2,35];
const RANK_LABELS = { 2: 'Top 1', 33: 'Top 2', 35: 'Top 3' };
const RANK_SCORES = { 2: '27,5', 33: '27,25', 35: '27' }; // original comma scores
const UNI_LOGOS = { 2: 'HUST.png', 33: 'HUP.webp', 35: 'NEU.png' };

function buildTop3Cards(){
  return TOP3_IDS.map(id => {
    const m = members.find(x => x.id === id) || {};
    const label = RANK_LABELS[id];
    const score = RANK_SCORES[id];
    const logo = UNI_LOGOS[id];
    return { m, label, score, logo, id };
  });
}

export function ThanhtichPage(){
  const [goldenHtml, setGoldenHtml] = useState(null);
  const [goldenError, setGoldenError] = useState(null);
  const [started, setStarted] = useState(false);

  const loadSheet = useCallback(async () => {
    try {
      const SHEET_ID = '1GtkKf1O_c0Nt6rIdDJE3BgOM2nEPni6leT9Oa0orFqM';
      const GID = '1086408627';
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;
      const resp = await fetch(url, { cache: 'no-cache' });
      const text = await resp.text();
      const jsonStr = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
      const data = JSON.parse(jsonStr);
      const cols = (data.table && data.table.cols) || [];
      const rows = (data.table && data.table.rows) || [];
      const allowedIndexes = cols.map((c,i)=>i).filter(i=>i<5);
      const filteredCols = cols.filter((c,i)=>allowedIndexes.includes(i));
      const sanitize = (s) => s == null ? '' : String(s)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
      let thead = '<thead class="bg-amber-50 dark:bg-amber-900/30 sticky top-0 z-10">\n<tr>' + filteredCols.map(c=>`<th class=\"px-4 py-2 text-left text-xs font-semibold text-amber-800 dark:text-amber-200 tracking-wide uppercase\">${sanitize(c.label || c.id)}</th>`).join('') + '</tr>\n</thead>';
      let tbody = '<tbody class="divide-y divide-gray-100 dark:divide-gray-700">';
      rows.forEach((r, idx) => {
        const cells = r.c || [];
        const zebra = idx % 2 === 0 ? 'bg-white dark:bg-gray-900/40' : 'bg-gray-50 dark:bg-gray-900/20';
        tbody += `<tr class="${zebra} hover:bg-amber-50/60 dark:hover:bg-amber-900/40 transition-colors">` +
          allowedIndexes.map(ci => {
            const cell = cells[ci];
            const v = cell && (cell.f || cell.v) ? (cell.f || cell.v) : '';
            return `<td class=\"px-4 py-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line\">${sanitize(v)}</td>`;
          }).join('') + '</tr>';
      });
      if(rows.length === 0){
        tbody = `<tbody><tr><td class=\"px-4 py-6 text-center text-sm text-gray-500\" colspan="${filteredCols.length}">Không có dữ liệu</td></tr></tbody>`;
      } else {
        tbody += '</tbody>';
      }
      setGoldenHtml(`<table class=\"min-w-full text-sm align-top\">${thead}${tbody}</table>`);
    } catch(e) {
      console.error(e);
      setGoldenError('Không tải được dữ liệu. Vui lòng thử lại sau.');
    }
  }, []);

  useEffect(() => { loadSheet(); }, [loadSheet]);

  // Intersection observer to trigger counters once
  useEffect(() => {
    const section = document.getElementById('counters-section');
    if(!section) return;
    if(!('IntersectionObserver' in window)) { setStarted(true); return; }
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(e => { if(e.isIntersecting) { setStarted(true); o.disconnect(); } });
    }, { threshold: 0.35 });
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  const top3 = buildTop3Cards();

  // Hover effect: swap label <-> score like original script
  useEffect(() => {
    const wrapper = document.getElementById('top3-wrapper');
    if(!wrapper) return;
    const cards = wrapper.querySelectorAll('.top3-card');
    cards.forEach(card => {
      const span = card.querySelector('.rank-text');
      if(!span) return;
      const original = span.dataset.label;
      const rawScore = span.dataset.score;
      const displayScore = rawScore.replace(/,/g,'.');
      function swap(newText){
        if(span.textContent === newText) return;
        span.style.opacity='0';
        span.style.transform='scale(0.82)';
        setTimeout(()=>{
          span.textContent=newText;
          span.style.opacity='1';
          span.style.transform='scale(1.08)';
          setTimeout(()=>{ span.style.transform='scale(1)'; },240);
        },150);
      }
      card.addEventListener('mouseenter', ()=>{ if(span.textContent===original) swap(displayScore); });
      card.addEventListener('mouseleave', ()=>{ if(span.textContent!==original) swap(original); });
    });
    return () => { cards.forEach(c=>{ c.replaceWith(c); }); };
  }, [top3]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="hero-block relative">
        <div className="container mx-auto px-6 py-24 text-center relative z-[1]">
          <HeroFrame text={classInfo.name} />
          <p className="mt-14 md:mt-20 text-2xl md:text-3xl font-semibold text-white drop-shadow-lg">Trường THPT Hoài Đức B</p>
          <p className="mt-8 md:mt-10 text-xl md:text-2xl text-white font-medium tracking-wide" id="classSlogan">{classInfo.slogan}</p>
        </div>
      </div>

      <main className="container mx-auto px-6 py-12 flex-1">
        <section id="counters-section" className="mb-20">
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">Thành Tích</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="p-6 bg-gradient-to-br from-green-50 to-white rounded-xl">
                {started ? <AnimatedCounter target={100} delayFirst /> : <div className='text-4xl font-extrabold text-green-600'>0%</div>}
                <p className="mt-2 text-gray-600">Số Lượng Học Sinh Trúng Tuyển</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-white to-green-50 rounded-xl">
                {started ? <AnimatedCounter target={76} /> : <div className='text-4xl font-extrabold text-green-600'>0%</div>}
                <p className="mt-2 text-gray-600">Công lập</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-white to-green-50 rounded-xl">
                {started ? <AnimatedCounter target={24} /> : <div className='text-4xl font-extrabold text-green-600'>0%</div>}
                <p className="mt-2 text-gray-600">Dân Lập</p>
              </div>
            </div>
          </div>
        </section>

        <h2 className="text-3xl font-bold text-center mb-12">Top 3 Học Sinh Xuất Sắc Nhất kì thi THPT quốc gia 2025</h2>
        <div id="top3-wrapper" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8 mb-16">
          {top3.map(({ m, label, score, logo, id }) => (
            <div key={id} className="top3-card member-card visible group relative parallelogram-shape cursor-pointer aspect-[2/3]">
              <div className="image-container absolute inset-0 z-[2]">
                <img
                  src={m.avatar}
                  alt={m.name}
                  onLoad={e => {
                    e.currentTarget.classList.add('loaded');
                    const parent = e.currentTarget.closest('.image-container');
                    if(parent) parent.classList.add('loaded');
                  }}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                />
              </div>
              {label && (
                <div className="rank-overlay absolute inset-0 flex items-center justify-center z-[3] pointer-events-none transition-opacity">
                  <span className="rank-text text-6xl md:text-7xl font-black text-gray-100/90 select-none tracking-tight transition-transform duration-300" data-label={label} data-score={score} style={{textShadow:'0 3px 6px rgba(0,0,0,.55),0 0 14px rgba(0,0,0,.35)'}}>{label}</span>
                </div>
              )}
              {logo && (
                <div className="uni-logo absolute top-2 left-1/2 -translate-x-1/2 z-[5] pointer-events-none">
                  <img src={`/${logo}`} alt="Logo" className="mx-auto object-contain" style={{maxWidth:'120px', filter:'drop-shadow(0 4px 8px rgba(0,0,0,.5))'}} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-[1]" />
              <div className="absolute bottom-0 left-0 w-full p-5 z-[4]">
                <h3 className="text-2xl font-bold text-white image-text-effect tracking-wide">{m.name}</h3>
                <p className="text-gray-200 image-text-effect font-medium">{m.nickname}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-20 mb-12" id="bang-vang-section">
          <div className="bg-white dark:bg-gray-800/60 rounded-2xl shadow-xl p-6 md:p-10">
            <h2 className="text-3xl font-extrabold text-center mb-6 text-amber-600 dark:text-amber-400 drop-shadow">Bảng vàng A12K45</h2>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">Tự động đồng bộ dữ liệu trực tiếp từ Google Sheets.</p>
            <div id="goldenBoard" className="relative">
              {!goldenHtml && !goldenError && (
                <div id="goldenBoardLoading" className="flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
                </div>
              )}
              {goldenError && <div id="goldenBoardError" className="text-center text-red-600 dark:text-red-400 text-sm py-6">{goldenError}</div>}
              {goldenHtml && (
                <div id="goldenBoardTableWrapper" className="overflow-auto max-h-[70vh] ring-1 ring-gray-200 dark:ring-gray-700 rounded-xl" dangerouslySetInnerHTML={{ __html: goldenHtml }} />
              )}
            </div>
            <div className="mt-4 text-center text-xs text-gray-400">Nguồn: Google Sheets (cập nhật mỗi lần tải trang)</div>
          </div>
        </section>
      </main>
    </div>
  );
}
