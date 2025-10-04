import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePosts } from '../context/PostContext.jsx';
import { compressMultiple } from '../utils/imageCompression.js';

export function PostComposer(){
  const { user, authenticated } = useAuth();
  const { createPost } = usePosts();
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]); // array of base64
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const textareaRef = useRef(null);
  const modalRef = useRef(null);

  // focus textarea when modal opens
  useEffect(()=>{ if(open && textareaRef.current){ textareaRef.current.focus(); } },[open]);
  // close on ESC
  useEffect(()=>{
    function onKey(e){ if(e.key === 'Escape'){ setOpen(false); } }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  },[]);
  const disabled = !authenticated;

  async function handleImages(e){
    const files = Array.from(e.target.files||[]);
    if(!files.length) return;
    const limit = 10;
    const remain = Math.max(0, limit - images.length);
    const slice = files.slice(0, remain);
    // compress sequentially to avoid spikes
    const compressed = await compressMultiple(slice, { targetMaxBytes: 350*1024, maxDimension: 1920, initialQuality: 0.85 });
    for(const file of compressed){
      const r = new FileReader();
      r.onload = ev => { setImages(prev=> [...prev, ev.target.result]); };
      r.readAsDataURL(file);
    }
  }
  function removeImage(idx){ setImages(prev => prev.filter((_,i)=> i!==idx)); }
  function clearAll(){ setImages([]); }

  function submit(e){
    e.preventDefault();
    if(disabled) return;
    const trimmed = content.trim();
    if(!trimmed && images.length===0){ setError('Nội dung trống'); return; }
    try {
      createPost(trimmed, images);
      setContent(''); setImages([]); setError(null); setOpen(false);
    } catch(err){ setError(err.message); }
  }

  return (
    <>
      {/* Compact one-line trigger */}
      <div className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-3xl p-4 shadow flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold flex items-center justify-center overflow-hidden flex-shrink-0">
          {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : (user?.name || user?.email || '?').charAt(0).toUpperCase()}
        </div>
        <button disabled={disabled} onClick={()=> setOpen(true)} className="flex-1 text-left text-sm px-4 py-2 rounded-full bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-600 dark:text-gray-300 disabled:opacity-60">
          {disabled ? 'Đăng nhập để viết...' : 'Bạn đang nghĩ gì?'}
        </button>
        <button disabled={disabled} onClick={()=> setOpen(true)} className="hidden sm:inline-flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg bg-green-50 dark:bg-gray-700 border border-green-200 dark:border-gray-600 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-gray-600">
          🖼️ <span>Ảnh</span>
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=> setOpen(false)} />
          <div ref={modalRef} className="relative w-full max-w-lg bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-5 flex flex-col gap-4 animate-scaleFade">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Tạo bài viết</h2>
              <button onClick={()=> setOpen(false)} className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-300" aria-label="Đóng">✕</button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold flex items-center justify-center overflow-hidden flex-shrink-0">
                {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : (user?.name || user?.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || user?.email || 'Ẩn danh'}</div>
            </div>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <textarea ref={textareaRef} disabled={disabled} value={content} onChange={e=>setContent(e.target.value)} placeholder={disabled ? 'Đăng nhập để viết...' : 'Bạn đang nghĩ gì?'} className="w-full min-h-[140px] resize-y bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              {images.length > 0 && (
                <div className="grid gap-2" style={{gridTemplateColumns: images.length===1? '1fr': images.length===2? 'repeat(2,1fr)': images.length===3? 'repeat(3,1fr)': 'repeat(4,1fr)'}}>
                  {images.slice(0,4).map((img,idx)=> {
                    const isOverflowThumb = idx===3 && images.length>4;
                    return (
                      <div key={idx} className="relative group aspect-square overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-black/5">
                        <img src={img} alt={"img"+idx} className="object-cover w-full h-full" />
                        {!isOverflowThumb && (
                          <button type="button" onClick={()=> removeImage(idx)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs flex items-center justify-center">✕</button>) }
                        {isOverflowThumb && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-semibold">
                            +{images.length - 3}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {images.length>4 && (
                    <div className="col-span-full text-[11px] text-gray-500 dark:text-gray-400">Tổng {images.length} ảnh (chỉ hiển thị 4, khi đăng sẽ lưu tất cả)</div>
                  )}
                  <button type="button" onClick={clearAll} className="col-span-full justify-self-end text-[11px] text-red-500 hover:underline">Xóa tất cả</button>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer text-xs font-medium px-3 py-2 rounded-lg bg-green-50 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-gray-600 border border-green-200 dark:border-gray-600 text-green-700 dark:text-green-300 flex items-center gap-2">
                    <span className="text-base">🖼️</span><span>Ảnh</span>
                    <input multiple type="file" accept="image/*" className="hidden" onChange={handleImages} />
                  </label>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button type="button" onClick={()=> setOpen(false)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium text-gray-600 dark:text-gray-200">Hủy</button>
                  <button disabled={disabled} className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold shadow">
                    Đăng
                  </button>
                </div>
              </div>
              {error && <div className="text-xs text-red-500 -mt-2">{error}</div>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
