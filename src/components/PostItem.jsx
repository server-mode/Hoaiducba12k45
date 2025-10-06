import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePosts } from '../context/PostContext.jsx';
import { formatDistanceToNow } from '../utils/formatDistance.js';
import { ReactionPicker, REACTIONS } from './ReactionPicker.jsx';
import { compressMultiple } from '../utils/imageCompression.js';

const REACTION_LABELS = { like:'👍', love:'❤️', haha:'😂', wow:'😮', sad:'😢', angry:'😡' };

function PostActions({ post }){
  const { updatePost, deletePost, restorePost, hardDeletePost } = usePosts();
  const { user } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [content, setContent] = useState(post.content);
  const [images, setImages] = useState(post.images || []);
  const [err, setErr] = useState(null);
  const menuRef = useRef(null);
  const textareaRef = useRef(null);

  React.useEffect(()=>{
    function onDoc(e){ if(menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(false); }
    document.addEventListener('mousedown', onDoc);
    return ()=> document.removeEventListener('mousedown', onDoc);
  },[]);

  React.useEffect(()=>{ if(openEdit && textareaRef.current){ textareaRef.current.focus(); } }, [openEdit]);
  React.useEffect(()=>{ if(openEdit){ document.body.style.overflow='hidden'; return ()=> { document.body.style.overflow=''; }; } }, [openEdit]);
  React.useEffect(()=>{
    function onKey(e){ if(e.key==='Escape' && openEdit) setOpenEdit(false); }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [openEdit]);

  async function handleImages(e){
    const files = Array.from(e.target.files||[]);
    if(!files.length) return;
    const remain = Math.max(0, 10 - images.length);
    const slice = files.slice(0, remain);
    const compressed = await compressMultiple(slice, { targetMaxBytes: 350*1024, maxDimension: 1920, initialQuality: 0.85 });
    for(const file of compressed){
      const r = new FileReader(); r.onload = ev => setImages(prev=>[...prev, ev.target.result]); r.readAsDataURL(file);
    }
  }
  function save(){
    if(!content.trim() && images.length===0){ setErr('Nội dung trống'); return; }
    updatePost(post.id, { content, images });
    setErr(null); setOpenEdit(false);
  }
  function removeImage(idx){ setImages(prev=> prev.filter((_,i)=> i!==idx)); }
  function clearAll(){ setImages([]); }
  function openEditModal(){ setContent(post.content); setImages(post.images||[]); setErr(null); setOpenEdit(true); setOpenMenu(false); }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button type="button" onClick={()=>setOpenMenu(o=>!o)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">⋮</button>
    {openMenu && (
          <div className="absolute right-0 mt-1 w-36 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg py-1 z-30 text-xs">
            {!post.deleted && <button onClick={openEditModal} className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">Sửa bài</button>}
            {!post.deleted && <button onClick={()=>{ if(confirm('Đánh dấu xoá bài viết?')) deletePost(post.id); }} className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-gray-700 text-red-600">{user?.isAdmin? 'Xoá mềm (Admin)' : 'Xoá'}</button>}
            {post.deleted && user?.isAdmin && <button onClick={()=> restorePost(post.id)} className="w-full text-left px-3 py-2 hover:bg-green-50 dark:hover:bg-gray-700 text-green-600">Khôi phục</button>}
            {post.deleted && user?.isAdmin && <button onClick={()=>{ if(confirm('Xóa vĩnh viễn?')) hardDeletePost(post.id); }} className="w-full text-left px-3 py-2 hover:bg-red-100 dark:hover:bg-gray-700 text-red-600">Xóa vĩnh viễn</button>}
          </div>
        )}
      </div>
      {openEdit && (
        <div className="fixed inset-0 z-[220] flex items-start md:items-center justify-center p-0 md:p-8">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=> setOpenEdit(false)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-none md:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 flex flex-col gap-5 animate-scaleFade">
            <div className="flex items-center justify-between">
              <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100">Chỉnh sửa bài viết</h2>
              <button onClick={()=> setOpenEdit(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">✕</button>
            </div>
            <textarea ref={textareaRef} value={content} onChange={e=>setContent(e.target.value)} placeholder="Nội dung..." className="w-full min-h-[160px] resize-y bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
            {images.length>0 && (
              <div className="grid gap-2" style={{gridTemplateColumns: images.length===1? '1fr': images.length===2? 'repeat(2,1fr)': images.length===3? 'repeat(3,1fr)':'repeat(4,1fr)'}}>
                {images.slice(0,4).map((img,idx)=> {
                  const overflow = idx===3 && images.length>4;
                  return (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img src={img} alt={"img"+idx} className="object-cover w-full h-full" />
                      {!overflow && (
                        <button type="button" onClick={()=> removeImage(idx)} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs flex items-center justify-center">✕</button>
                      )}
                      {overflow && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-semibold">+{images.length-3}</div>
                      )}
                    </div>
                  );
                })}
                {images.length>4 && <div className="col-span-full text-[11px] text-gray-500 dark:text-gray-400">Tổng {images.length} ảnh</div>}
                <button type="button" onClick={clearAll} className="col-span-full justify-self-end text-[11px] text-red-500 hover:underline">Xóa tất cả</button>
              </div>
            )}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer text-xs font-medium px-3 py-2 rounded-lg bg-green-50 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-gray-600 border border-green-200 dark:border-gray-600 text-green-700 dark:text-green-300 flex items-center gap-2">
                  <span className="text-base">🖼️</span><span>Ảnh</span>
                  <input multiple type="file" accept="image/*" className="hidden" onChange={handleImages} />
                </label>
                {images.length>0 && <button type="button" onClick={clearAll} className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">Xóa hết</button>}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button type="button" onClick={()=> setOpenEdit(false)} className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs font-medium text-gray-700 dark:text-gray-200">Hủy</button>
                <button type="button" onClick={save} className="px-6 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow">Lưu</button>
              </div>
            </div>
            {err && <div className="text-xs text-red-500">{err}</div>}
          </div>
        </div>
      )}
    </>
  );
}

function ReactionBar({ post }){
  const { user } = useAuth();
  const { choosePostReaction, togglePostReaction } = usePosts();
  const userId = user?.id;
  const [pickerOpen, setPickerOpen] = useState(false);
  const btnRef = useRef(null);

  const userReaction = React.useMemo(()=>{
    if(!userId) return null;
    return Object.keys(post.reactions).find(k => (post.reactions[k]||[]).includes(userId)) || null;
  }, [userId, post.reactions]);

  function onPrimaryClick(){
    if(!userId) return; // require auth
    if(userReaction){
      togglePostReaction(post.id, userReaction); // remove existing reaction (correct helper)
    } else {
      setPickerOpen(true);
    }
  }

  const total = Object.values(post.reactions).reduce((a,arr)=> a + (arr?.length||0), 0);
  const topReactions = Object.entries(post.reactions)
    .filter(([,arr])=>arr.length>0)
    .sort((a,b)=> b[1].length - a[1].length)
    .slice(0,3)
    .map(([k])=>REACTION_LABELS[k]);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4">
        <button ref={btnRef} onClick={onPrimaryClick} onMouseEnter={()=>{ if(!userReaction) setPickerOpen(true); }} onMouseLeave={()=>{ /* leave handled by picker click outside */ }} className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border transition ${userReaction ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
          {userReaction ? REACTION_LABELS[userReaction] : '👍'}
          <span>{userReaction ? 'Bạn' : 'Thích'}</span>
        </button>
        {total>0 && <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">{topReactions.map(r=> <span key={r}>{r}</span>)} <span className="ml-1">{total}</span></div>}
      </div>
      {pickerOpen && btnRef.current && (
        <ReactionPicker anchorRect={btnRef.current.getBoundingClientRect()} onSelect={(t)=>choosePostReaction(post.id, t)} onClose={()=>setPickerOpen(false)} />
      )}
    </div>
  );
}

function Comments({ post, preview=false, onRequestExpand }){
  const { user, authenticated } = useAuth();
  const { addComment, usersMap = {}, chooseCommentReaction, toggleCommentReaction, deleteComment, updateComment, addReply, chooseReplyReaction, toggleReplyReaction, deleteReply, updateReply } = usePosts();
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activePicker, setActivePicker] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // comment id
  const [editingComment, setEditingComment] = useState(null); // comment id
  const [editingCommentValue, setEditingCommentValue] = useState('');
  const [editingReply, setEditingReply] = useState(null); // reply id
  const [editingReplyValue, setEditingReplyValue] = useState('');
  const [activeReplyPicker, setActiveReplyPicker] = useState(null); // reply id
  const [replyInputs, setReplyInputs] = useState({}); // commentId -> text
  const [commentImage, setCommentImage] = useState(null);
  const [replyImages, setReplyImages] = useState({}); // commentId -> image
  const btnRefs = useRef({});
  const replyBtnRefs = useRef({});
  React.useEffect(()=>{
    function onDoc(e){
      if((e.target.closest && e.target.closest('.reaction-picker'))){
        return; // clicks inside picker should not close before selection
      }
      if(activePicker){
        const btn = btnRefs.current[activePicker];
        if(btn && !btn.contains(e.target)) setActivePicker(null);
      }
      if(activeReplyPicker){
        const btn = replyBtnRefs.current[activeReplyPicker];
        if(btn && !btn.contains(e.target)) setActiveReplyPicker(null);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return ()=> document.removeEventListener('mousedown', onDoc);
  }, [activePicker, activeReplyPicker]);

  function handleCommentImage(e){
    const file = e.target.files?.[0]; if(!file) return;
    if(file.size > 1024*1024) return; // 1MB
    const r = new FileReader(); r.onload = ev => setCommentImage(ev.target.result); r.readAsDataURL(file);
  }
  function handleReplyImage(e, cid){
    const file = e.target.files?.[0]; if(!file) return;
    if(file.size > 1024*1024) return;
    const r = new FileReader(); r.onload = ev => setReplyImages(p=>({...p, [cid]: ev.target.result})); r.readAsDataURL(file);
  }
  function clearReplyImage(cid){ setReplyImages(p=>({...p, [cid]: null})); }

  async function submit(e){
    e.preventDefault();
    if(!authenticated || sending) return;
    const t = value.trim();
    if(!t && !commentImage) return;
    setSending(true); setErrorMsg('');
    try {
      const res = await addComment(post.id, t, commentImage);
      // stealth refresh after successful send (illusion of live page reload)
  // removed stealth refresh call after send
      setValue(''); setCommentImage(null);
    } catch(err){
      setErrorMsg(err.message||'Lỗi gửi bình luận');
    } finally {
      setSending(false);
    }
  }

  const allComments = post.comments;
  const showComments = preview ? allComments.slice(-2) : allComments;
  return (
    <div className="mt-3 space-y-3">
      <div className="space-y-2">
        {showComments.map(c => {
          const commentAuthor = usersMap[c.authorId] || {};
          const displayName = commentAuthor.name || c.authorName || 'Ẩn danh';
          const avatar = commentAuthor.avatar || c.authorAvatar;
          const commentUserReaction = user ? Object.keys(c.reactions||{}).find(k => (c.reactions?.[k]||[]).includes(user.id)) : null;
          const commentTotal = c.reactions ? Object.values(c.reactions).reduce((a,arr)=> a + (arr?.length||0),0) : 0;
          return (
            <div key={c.id} className="flex gap-2 items-start">
              <button type="button" onClick={()=> window.location.href = `/profile/${c.authorId}`} className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-semibold overflow-hidden focus:outline-none focus:ring-2 focus:ring-green-500">
                {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : displayName.charAt(0).toUpperCase()}
              </button>
              <div className="bg-gray-100 dark:bg-gray-800/70 px-3 py-2 rounded-xl text-xs leading-relaxed flex-1">
                <div className="flex justify-between gap-3">
                  <button type="button" onClick={()=> window.location.href = `/profile/${c.authorId}`} className="font-semibold text-left text-gray-800 dark:text-gray-100 hover:underline">{displayName}</button>
                  {(user?.id === c.authorId || user?.isAdmin) && (
                    <CommentMenu onEdit={()=>{ setEditingComment(c.id); setEditingCommentValue(c.content); }} onDelete={()=> deleteComment(post.id, c.id)} />
                  )}
                </div>
                {editingComment === c.id ? (
                  <div className="mt-1 space-y-2">
                    <textarea value={editingCommentValue} onChange={e=>setEditingCommentValue(e.target.value)} rows={2} className="w-full resize-none p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/60 focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <div className="flex gap-2">
                      <button onClick={()=>{ updateComment(post.id, c.id, editingCommentValue); setEditingComment(null); }} className="px-3 py-1 rounded-md bg-green-600 text-white text-[11px]">Lưu</button>
                      <button onClick={()=>{ setEditingComment(null); setEditingCommentValue(''); }} className="px-3 py-1 rounded-md bg-gray-300 dark:bg-gray-700 text-[11px]">Hủy</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {c.content}
                    {c.pending && <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-orange-500 animate-pulse">⏳ đang gửi...</span>}
                  </div>
                )}
                {c.image && (
                  <div className="mt-2"><img src={c.image} alt="comment" className="w-40 max-h-40 object-cover rounded-lg border border-gray-300 dark:border-gray-600" /></div>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">{formatDistanceToNow(c.createdAt)}</span>
                  <button onClick={()=> {
                    if(!user) return;
                    if(commentUserReaction) toggleCommentReaction(post.id, c.id, commentUserReaction); else setActivePicker(c.id);
                  }} ref={r=> btnRefs.current[c.id]=r} className={`px-2 py-0.5 rounded-full border text-[10px] flex items-center gap-1 ${commentUserReaction? 'bg-green-600 text-white border-green-600':'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>{commentUserReaction? REACTION_LABELS[commentUserReaction] : (()=>{ const ordered = Object.entries(c.reactions||{}).filter(([,arr])=>arr?.length).sort((a,b)=> b[1].length - a[1].length); return ordered.length? REACTION_LABELS[ordered[0][0]] : '👍'; })()} {commentTotal>0 && <span>{commentTotal}</span>}</button>
                  <button onClick={()=> setReplyingTo(replyingTo===c.id?null:c.id)} className="text-[10px] text-green-600 hover:underline">{replyingTo===c.id?'Đóng':'Trả lời'}</button>
                </div>
                {replyingTo === c.id && (
                  <div className="mt-2 flex gap-2 items-start">
                    <textarea value={replyInputs[c.id]||''} onChange={e=> setReplyInputs(prev=>({...prev, [c.id]: e.target.value}))} rows={2} className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900/60 resize-none focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Viết phản hồi..." />
                    <div className="flex flex-col items-center gap-2">
                      <label className="text-[10px] cursor-pointer px-2 py-1 rounded bg-green-50 dark:bg-gray-700 border border-green-200 dark:border-gray-600 text-green-600 dark:text-green-300">Ảnh
                        <input type="file" accept="image/*" className="hidden" onChange={(e)=>handleReplyImage(e,c.id)} />
                      </label>
                      {replyImages[c.id] && (
                        <div className="relative w-16 h-16">
                          <img src={replyImages[c.id]} alt="reply" className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600" />
                          <button type="button" onClick={()=> clearReplyImage(c.id)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center">✕</button>
                        </div>
                      )}
                    </div>
                    <button onClick={()=>{ const txt=(replyInputs[c.id]||'').trim(); if(!txt && !replyImages[c.id]) return; addReply(post.id, c.id, txt, replyImages[c.id]||null); setReplyInputs(p=>({...p, [c.id]:''})); clearReplyImage(c.id); setReplyingTo(null); }} className="px-3 py-2 rounded-lg bg-green-600 text-white text-[11px]">Gửi</button>
                  </div>
                )}
                {c.replies?.length > 0 && (
                  <div className="mt-3 space-y-2 border-l border-gray-300 dark:border-gray-700 pl-3">
                    {c.replies.map(r => {
                      const replyAuthor = usersMap[r.authorId] || {};
                      const replyName = replyAuthor.name || 'Ẩn danh';
                      const replyUserReaction = user ? Object.keys(r.reactions||{}).find(k => (r.reactions?.[k]||[]).includes(user.id)) : null;
                      const replyTotal = r.reactions ? Object.values(r.reactions).reduce((a,arr)=> a + (arr?.length||0),0) : 0;
                      return (
                        <div key={r.id} className="flex gap-2 items-start">
                          <div className="w-6 h-6 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center overflow-hidden">{replyAuthor.avatar? <img src={replyAuthor.avatar} alt="avatar" className="w-full h-full object-cover" /> : replyName.charAt(0).toUpperCase()}</div>
                          <div className="flex-1 bg-gray-50 dark:bg-gray-900/60 rounded-xl px-3 py-2">
                            <div className="flex justify-between gap-2">
                              <span className="font-semibold text-gray-700 dark:text-gray-200 text-[11px]">{replyName}</span>
                              {(user?.id === r.authorId || user?.isAdmin) && <CommentMenu small onEdit={()=>{ setEditingReply(r.id); setEditingReplyValue(r.content); }} onDelete={()=> deleteReply(post.id, c.id, r.id)} />}
                            </div>
                            {editingReply === r.id ? (
                              <div className="mt-1 space-y-2">
                                <textarea value={editingReplyValue} onChange={e=>setEditingReplyValue(e.target.value)} rows={2} className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/60 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 text-[11px]" />
                                <div className="flex gap-2">
                                  <button onClick={()=>{ updateReply(post.id, c.id, r.id, editingReplyValue); setEditingReply(null); }} className="px-3 py-1 rounded-md bg-green-600 text-white text-[10px]">Lưu</button>
                                  <button onClick={()=>{ setEditingReply(null); setEditingReplyValue(''); }} className="px-3 py-1 rounded-md bg-gray-300 dark:bg-gray-700 text-[10px]">Hủy</button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[11px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{r.content}</div>
                            )}
                            {r.image && (<div className="mt-2"><img src={r.image} alt="reply" className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600" /></div>)}
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-[9px] text-gray-400">{formatDistanceToNow(r.createdAt)}</span>
                              <button onClick={()=> {
                                if(!user) return;
                                if(replyUserReaction) toggleReplyReaction(post.id, c.id, r.id, replyUserReaction); else setActiveReplyPicker(r.id);
                              }} ref={ref=> replyBtnRefs.current[r.id]=ref} className={`px-2 py-0.5 rounded-full border text-[9px] flex items-center gap-1 ${replyUserReaction? 'bg-green-600 text-white border-green-600':'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>{replyUserReaction? REACTION_LABELS[replyUserReaction] : (()=>{ const ordered = Object.entries(r.reactions||{}).filter(([,arr])=>arr?.length).sort((a,b)=> b[1].length - a[1].length); return ordered.length? REACTION_LABELS[ordered[0][0]] : '👍'; })()} {replyTotal>0 && <span>{replyTotal}</span>}</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {preview && allComments.length > showComments.length && (
          <button type="button" onClick={onRequestExpand} className="text-[11px] text-green-600 hover:underline px-2">Xem thêm {allComments.length - showComments.length} bình luận...</button>
        )}
        {activePicker && btnRefs.current[activePicker] && (
          <ReactionPicker anchorRect={btnRefs.current[activePicker].getBoundingClientRect()} onSelect={(t)=>{ chooseCommentReaction(post.id, activePicker, t); setActivePicker(null); }} onClose={()=> setActivePicker(null)} />
        )}
        {activeReplyPicker && replyBtnRefs.current[activeReplyPicker] && (
          <ReactionPicker anchorRect={replyBtnRefs.current[activeReplyPicker].getBoundingClientRect()} onSelect={(t)=>{ chooseReplyReaction(post.id, post.comments.find(c=> c.replies?.some(r=>r.id===activeReplyPicker))?.id, activeReplyPicker, t); setActiveReplyPicker(null); }} onClose={()=> setActiveReplyPicker(null)} />
        )}
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <input
            disabled={!authenticated}
            value={value}
            onChange={e=>setValue(e.target.value)}
            // removed stealth refresh on focus
            placeholder={authenticated ? 'Viết bình luận...' : 'Đăng nhập để bình luận'}
            name="comment"
            id={`comment-input-${post.id}`}
            
            autoComplete="off"
            className="flex-1 text-xs px-3 py-2 rounded-full bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <label className="text-[10px] cursor-pointer px-2 py-1 rounded bg-green-50 dark:bg-gray-700 border border-green-200 dark:border-gray-600 text-green-600 dark:text-green-300">Ảnh
            <input type="file" accept="image/*" className="hidden" onChange={handleCommentImage} />
          </label>
        </div>
        {commentImage && (
          <div className="relative w-16 h-16">
            <img src={commentImage} alt="comment" className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600" />
            <button type="button" onClick={()=> setCommentImage(null)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center">✕</button>
          </div>
        )}
        <button disabled={!authenticated || (!value.trim() && !commentImage) || sending} className="text-xs px-3 py-2 rounded-full bg-green-600 text-white disabled:opacity-50">{sending? 'Đang gửi...' : 'Gửi'}</button>
      </form>
      {errorMsg && <div className="text-[11px] text-red-500">{errorMsg}</div>}
    </div>
  );
}

// Small reusable 3-dot menu for comments/replies
function CommentMenu({ onEdit, onDelete, small }){
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { user } = useAuth();
  React.useEffect(()=>{
    function onDoc(e){ if(ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return ()=> document.removeEventListener('mousedown', onDoc);
  },[]);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={()=>setOpen(o=>!o)} className={`${small?'w-6 h-6 text-[10px]':'w-6 h-6'} flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500`}>⋮</button>
      {open && (
        <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 text-[11px] z-40">
          <button onClick={()=>{ onEdit(); setOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">Sửa</button>
          <button onClick={()=>{ onDelete(); setOpen(false); }} className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-gray-700 text-red-600">{user?.isAdmin? 'Xóa (Admin)':'Xóa'}</button>
        </div>
      )}
    </div>
  );
}

function FocusPostModal({ post, onClose }){
  return (
    <div className="fixed inset-0 z-[160] flex items-start md:items-center justify-center p-0 md:p-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-3xl max-h-[95vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-none md:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white text-lg">✕</button>
        <div className="p-6 md:p-10">
          <PostItemInner post={post} focusMode onCloseFocus={onClose} />
        </div>
      </div>
    </div>
  );
}

function PostItemInner({ post, focusMode=false, onCloseFocus, onOpenFocus }){
  const { usersMap = {} } = usePosts();
  const { user } = useAuth();
  const author = usersMap[post.authorId] || {};
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  function openGallery(idx){ setGalleryIndex(idx); setGalleryOpen(true); document.body.style.overflow='hidden'; }
  function closeGallery(){ setGalleryOpen(false); document.body.style.overflow=''; }
  function nextImg(){ setGalleryIndex(i => (i+1) % post.images.length); }
  function prevImg(){ setGalleryIndex(i => (i-1+post.images.length) % post.images.length); }
  React.useEffect(()=>{
    function onKey(e){ if(!galleryOpen) return; if(e.key==='Escape') closeGallery(); if(e.key==='ArrowRight') nextImg(); if(e.key==='ArrowLeft') prevImg(); }
    window.addEventListener('keydown', onKey); return ()=> window.removeEventListener('keydown', onKey);
  }, [galleryOpen, post.images?.length]);
  return (
    <article className={`${focusMode? 'bg-transparent shadow-none p-0 border-0' : 'bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 shadow-lg'} rounded-3xl p-0`}> 
      <div className={`${focusMode? '' : 'p-8 md:p-10'} rounded-3xl`}>
      <header className="flex items-start gap-4">
        <button type="button" onClick={()=> window.location.href = `/profile/${post.authorId}`} className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold flex items-center justify-center overflow-hidden ring-0 focus:outline-none focus:ring-2 focus:ring-green-500 transition">
          {author?.avatar ? <img src={author.avatar} alt="avatar" className="w-full h-full object-cover" /> : (author?.name||author?.email||'?').charAt(0).toUpperCase()}
        </button>
        <div className="flex-1 min-w-0">
          <button type="button" onClick={()=> window.location.href = `/profile/${post.authorId}`} className="font-semibold text-left text-[17px] md:text-[18px] text-gray-800 dark:text-gray-100 leading-tight hover:underline">
            {author?.name || 'Ẩn danh'}
          </button>
          <div className="text-[12px] text-gray-400 flex gap-2 items-center">
            {formatDistanceToNow(post.createdAt)}
            <span className="hidden md:inline text-gray-500">• {new Date(post.createdAt).toLocaleString()}</span>
            {post.updatedAt && <span>(đã sửa)</span>}
            {post.deleted && <span className="text-red-500 font-medium">[ĐÃ XÓA]</span>}
          </div>
        </div>
        {(user?.id === post.authorId || user?.isAdmin) && (
          <PostActions post={post} />
        )}
      </header>
      {post.content && <div className="mt-6 text-[16px] md:text-[17px] leading-relaxed whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">{post.content}</div>}
      {post.images && post.images.length>0 && (
        <div className="mt-6">
          {!focusMode && (
            <div className={`grid gap-2 ${post.images.length===1? 'grid-cols-1':'grid-cols-2'}`}>
              {post.images.slice(0,4).map((img,idx)=>{
                const overflow = idx===3 && post.images.length>4;
                const single = post.images.length===1;
                return (
                  <button type="button" onClick={()=> openGallery(idx)} key={idx} className={`group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-black/5 ${single? 'aspect-[4/3] md:aspect-[4/3]' : 'aspect-square'} flex items-center justify-center`}>
                    <img src={img} alt={'pimg'+idx} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                    {overflow && (
                      <div onClick={()=> openGallery(3)} className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-3xl font-semibold">
                        +{post.images.length-3}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {focusMode && (
            <div className="grid gap-3 md:gap-4" style={{gridTemplateColumns: post.images.length===1? 'minmax(0,1fr)': post.images.length===2? 'repeat(2,minmax(0,1fr))': 'repeat(auto-fill,minmax(220px,1fr))'}}>
              {post.images.map((img,idx)=>(
                <button type="button" onClick={()=> openGallery(idx)} key={idx} className={`relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black/5 group ${post.images.length===1? 'aspect-[4/3] md:aspect-[4/3]' : 'aspect-square md:aspect-[4/3]'} flex items-center justify-center`}>
                  <img src={img} alt={'full'+idx} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {galleryOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={closeGallery} />
          <div className="relative w-full max-w-4xl flex flex-col gap-4">
            <div className="flex items-center justify-between text-white text-sm px-1">
              <span>{galleryIndex+1}/{post.images.length}</span>
              <button onClick={closeGallery} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white">✕</button>
            </div>
            <div className="relative self-center w-[min(100%,880px)] h-[70vh] max-h-[780px] rounded-2xl bg-black flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center bg-black">
                <img src={post.images[galleryIndex]} alt="view" className="max-w-full max-h-full object-contain" />
              </div>
              {post.images.length>1 && <>
                <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white text-xl flex items-center justify-center backdrop-blur-sm">‹</button>
                <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white text-xl flex items-center justify-center backdrop-blur-sm">›</button>
              </>}
            </div>
            {post.images.length>1 && (
              <div className="mx-auto w-full max-w-4xl flex flex-wrap gap-2 justify-center">
                {post.images.map((img,idx)=>(
                  <button key={idx} onClick={()=> setGalleryIndex(idx)} className={`relative rounded-md overflow-hidden border ${galleryIndex===idx? 'border-green-500 shadow-lg':'border-transparent'} bg-white/10 w-16 h-16 md:w-20 md:h-20 group`}>
                    <img src={img} alt={'thumb'+idx} className="w-full h-full object-cover group-hover:opacity-80" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <ReactionBar post={post} />
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Bình luận</span>
          <RefreshCommentsButton postId={post.id} />
        </div>
        <Comments post={post} preview={!focusMode} onRequestExpand={onOpenFocus} />
      </div>
      {!focusMode && (
        <div className="mt-6 flex justify-end">
          <OpenFocusButton onOpen={onOpenFocus} />
        </div>
      )}
      {focusMode && (
        <div className="mt-8 flex justify-end">
          <button onClick={onCloseFocus} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium">Đóng</button>
        </div>
      )}
      </div>
    </article>
  );
}

function OpenFocusButton({ onOpen }){
  return <button onClick={onOpen} className="px-5 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium shadow">Bình luận</button>;
}

export function PostItem({ post }){
  const [openFocus, setOpenFocus] = useState(false);
  React.useEffect(()=>{ if(openFocus){ document.body.style.overflow='hidden'; } else { document.body.style.overflow=''; } }, [openFocus]);
  return (
    <>
      <PostItemInner post={post} onCloseFocus={()=> setOpenFocus(false)} onOpenFocus={()=> setOpenFocus(true)} />
      {openFocus && <FocusPostModal post={post} onClose={()=> setOpenFocus(false)} />}
    </>
  );
}

export function PostList({ posts }){
  const { user } = useAuth();
  const visible = user?.isAdmin ? posts : posts.filter(p=> !p.deleted);
  if(!visible.length) return <div className="text-sm text-gray-500 text-center py-10">Chưa có bài viết nào</div>;
  return (
    <div className="space-y-4">
      {visible.map(p => <PostItem key={p.id} post={p} />)}
    </div>
  );
}

// Refresh comments button (manual fetch if realtime misses)
function RefreshCommentsButton({ postId }){
  const { refreshPost, isRefreshing } = usePosts();
  const spinning = isRefreshing(postId);
  return (
    <button
      type="button"
      onClick={()=> refreshPost(postId)}
      disabled={spinning}
      title="Làm mới bình luận"
      className={`w-7 h-7 flex items-center justify-center rounded-full border text-gray-500 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-gray-700 text-xs ${spinning? 'animate-spin pointer-events-none opacity-70':''}`}
      style={{ fontSize:'13px' }}
    >
      {spinning ? '↻' : '⟳'}
    </button>
  );
}
