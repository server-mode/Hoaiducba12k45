import React, { useEffect, useRef } from 'react';

export const REACTIONS = [
  { type:'like', label:'Thích', icon:'👍' },
  { type:'love', label:'Yêu thích', icon:'❤️' },
  { type:'haha', label:'Haha', icon:'😂' },
  { type:'wow', label:'Wow', icon:'😮' },
  { type:'sad', label:'Buồn', icon:'😢' },
  { type:'angry', label:'Phẫn nộ', icon:'😡' }
];

export function ReactionPicker({ onSelect, onClose, anchorRect }){
  const ref = useRef(null);
  useEffect(()=>{
    function onDoc(e){ if(ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('mousedown', onDoc);
    return ()=> document.removeEventListener('mousedown', onDoc);
  }, [onClose]);

  // Width estimate (6 reactions * ~40px each + gaps) ~ 260
  const PICKER_WIDTH = 260;
  const PICKER_HEIGHT = 70;
  let style = {};
  if(anchorRect){
    // Center above (or below if not enough space)
    const centerX = anchorRect.left + anchorRect.width/2;
    let left = centerX - PICKER_WIDTH/2;
    left = Math.max(8, Math.min(window.innerWidth - PICKER_WIDTH - 8, left));
    let top = anchorRect.top - PICKER_HEIGHT - 8; // prefer above
    if(top < 4){
      top = anchorRect.bottom + 8; // fallback below
    }
    style = { position:'fixed', top, left, width:PICKER_WIDTH, zIndex:200 };
  }

  return (
  <div ref={ref} style={style} className="reaction-picker select-none">
      <div className="flex gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-full shadow-xl border border-gray-200 dark:border-gray-600">
        {REACTIONS.map(r => (
          <button key={r.type} onClick={()=>{ onSelect(r.type); onClose(); }} className="flex flex-col items-center text-xs focus:outline-none group">
            <span className="text-2xl leading-none group-hover:scale-125 transition-transform drop-shadow">{r.icon}</span>
            <span className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
