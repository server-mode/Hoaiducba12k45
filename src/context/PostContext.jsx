// CLEAN MINIMAL IMPLEMENTATION STARTS HERE
import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from './AuthContext.jsx';

const DEFAULT_REACTIONS = { like:[], love:[], haha:[], wow:[], sad:[], angry:[] };
const PostContext = createContext(null);

export function PostProvider({ children }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(false);
  const channelRef = useRef(null);
  // Track pending optimistic comments (temp ids -> timeout handles)
  const pendingTimersRef = useRef({});
  function clearPendingTimer(tempId){
    if(pendingTimersRef.current[tempId]){ clearTimeout(pendingTimersRef.current[tempId]); delete pendingTimersRef.current[tempId]; }
  }

  const ensureProfiles = useCallback(async (ids)=>{
    const list = ids.filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).filter(id=>!profiles[id]);
    if(!list.length) return;
    const { data } = await supabase.from('profiles').select('id,name,avatar_url').in('id', list);
    if(data){ setProfiles(prev => ({ ...prev, ...data.reduce((m,p)=>{ m[p.id]={ id:p.id, name:p.name, avatar:p.avatar_url }; return m; }, {}) })); }
  }, [profiles]);

  const loadInitial = useCallback(async ()=>{
    setLoading(true);
    const { data: postRows, error } = await supabase.from('posts').select('*').order('created_at',{ascending:false}).limit(100);
    if(error){ setLoading(false); return; }
    const postIds = (postRows||[]).map(p=>p.id);
    let comments=[]; if(postIds.length){ const { data } = await supabase.from('comments').select('*').in('post_id', postIds).order('created_at',{ascending:true}); comments=data||[]; }
    const commentIds = comments.map(c=>c.id);
    let replies=[]; if(commentIds.length){ const { data } = await supabase.from('replies').select('*').in('comment_id', commentIds).order('created_at',{ascending:true}); replies=data||[]; }
    const entityIds=[...postIds, ...commentIds, ...replies.map(r=>r.id)];
    let rx=[]; if(entityIds.length){ const { data } = await supabase.from('reactions').select('*').in('entity_id', entityIds); rx=data||[]; }
    const rxMap={}; rx.forEach(r=>{ if(!rxMap[r.entity_id]) rxMap[r.entity_id]={ like:[], love:[], haha:[], wow:[], sad:[], angry:[] }; rxMap[r.entity_id][r.reaction_type]=[...rxMap[r.entity_id][r.reaction_type], r.user_id]; });
    const repliesByComment={}; replies.forEach(r=>{ if(!repliesByComment[r.comment_id]) repliesByComment[r.comment_id]=[]; repliesByComment[r.comment_id].push({ id:r.id, authorId:r.author_id, content:r.content||'', image:r.image_url||null, createdAt:r.created_at, updatedAt:r.updated_at, deleted:r.deleted, reactions:rxMap[r.id]||{...DEFAULT_REACTIONS} }); });
    const commentsByPost={}; comments.forEach(c=>{ if(!commentsByPost[c.post_id]) commentsByPost[c.post_id]=[]; commentsByPost[c.post_id].push({ id:c.id, authorId:c.author_id, content:c.content||'', image:c.image_url||null, createdAt:c.created_at, updatedAt:c.updated_at, deleted:c.deleted, reactions:rxMap[c.id]||{...DEFAULT_REACTIONS}, replies:repliesByComment[c.id]||[] }); });
    const full=(postRows||[]).map(p=>({ id:p.id, authorId:p.author_id, content:p.content||'', images:p.images||[], createdAt:p.created_at, updatedAt:p.updated_at, deleted:p.deleted, reactions:rxMap[p.id]||{...DEFAULT_REACTIONS}, comments:commentsByPost[p.id]||[] }));
    setPosts(full); setLoading(false);
    ensureProfiles(full.flatMap(p=>[p.authorId, ...p.comments.map(c=>c.authorId), ...p.comments.flatMap(c=>c.replies.map(r=>r.authorId))]));
  }, [ensureProfiles]);

  useEffect(()=>{ loadInitial(); }, [loadInitial]);

  useEffect(()=>{
    if(channelRef.current) return;
    const ch = supabase.channel('rt-feed')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'posts' }, payload=>{ const r=payload.new; setPosts(prev=> prev.some(p=>p.id===r.id)? prev : [{ id:r.id, authorId:r.author_id, content:r.content||'', images:r.images||[], createdAt:r.created_at, updatedAt:r.updated_at, deleted:r.deleted, reactions:{...DEFAULT_REACTIONS}, comments:[] }, ...prev]); ensureProfiles([r.author_id]); })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'posts' }, payload=>{ const r=payload.new; setPosts(prev=> prev.map(p=> p.id===r.id? { ...p, content:r.content||p.content, images:r.images||p.images, updatedAt:r.updated_at, deleted:r.deleted }: p)); })
      .on('postgres_changes', { event:'DELETE', schema:'public', table:'posts' }, payload=>{ const o=payload.old; setPosts(prev=> prev.filter(p=>p.id!==o.id)); })
  .on('postgres_changes', { event:'INSERT', schema:'public', table:'comments' }, payload=>{ const r=payload.new; setPosts(prev=> prev.map(p=> { if(p.id!==r.post_id) return p; if(p.comments.some(c=>c.id===r.id)) return p; const match = p.comments.find(c=> c.pending && c.authorId===r.author_id && c.content===(r.content||'').trim()); if(match){ clearPendingTimer(match.id); return { ...p, comments: p.comments.map(c=> c===match ? { id:r.id, authorId:r.author_id, content:r.content||'', image:r.image_url||null, createdAt:r.created_at, updatedAt:r.updated_at, deleted:r.deleted, reactions:{...DEFAULT_REACTIONS}, replies:[], pending:false } : c) }; } return { ...p, comments: [...p.comments, { id:r.id, authorId:r.author_id, content:r.content||'', image:r.image_url||null, createdAt:r.created_at, updatedAt:r.updated_at, deleted:r.deleted, reactions:{...DEFAULT_REACTIONS}, replies:[] }] }; })); ensureProfiles([r.author_id]); })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'comments' }, payload=>{ const r=payload.new; setPosts(prev=> prev.map(p=> p.id===r.post_id? { ...p, comments: p.comments.map(c=> c.id===r.id? { ...c, content:r.content||c.content, image:r.image_url||c.image, updatedAt:r.updated_at, deleted:r.deleted }: c) }: p)); })
      .on('postgres_changes', { event:'DELETE', schema:'public', table:'comments' }, payload=>{ const o=payload.old; setPosts(prev=> prev.map(p=> p.id===o.post_id? { ...p, comments: p.comments.filter(c=>c.id!==o.id) }: p)); })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'replies' }, payload=>{ const r=payload.new; setPosts(prev=> prev.map(p=> { const has=p.comments.some(c=>c.id===r.comment_id); if(!has) return p; return { ...p, comments: p.comments.map(c=> c.id===r.comment_id? { ...c, replies: c.replies.some(x=>x.id===r.id)? c.replies : [...c.replies, { id:r.id, authorId:r.author_id, content:r.content||'', image:r.image_url||null, createdAt:r.created_at, updatedAt:r.updated_at, deleted:r.deleted, reactions:{...DEFAULT_REACTIONS} }] }: c) }; })); ensureProfiles([r.author_id]); })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'replies' }, payload=>{ const r=payload.new; setPosts(prev=> prev.map(p=> ({ ...p, comments: p.comments.map(c=> c.replies.some(x=>x.id===r.id)? { ...c, replies: c.replies.map(rv=> rv.id===r.id? { ...rv, content:r.content||rv.content, image:r.image_url||rv.image, updatedAt:r.updated_at, deleted:r.deleted }: rv) }: c) }))); })
      .on('postgres_changes', { event:'DELETE', schema:'public', table:'replies' }, payload=>{ const o=payload.old; setPosts(prev=> prev.map(p=> ({ ...p, comments: p.comments.map(c=> ({ ...c, replies: c.replies.filter(r=>r.id!==o.id) })) }))); })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'reactions' }, payload=>{ const r=payload.new; setPosts(prev=> prev.map(p=> { if(r.entity_type==='post' && p.id===r.entity_id){ const reactions={...p.reactions}; const arr=reactions[r.reaction_type]||[]; if(!arr.includes(r.user_id)) reactions[r.reaction_type]=[...arr,r.user_id]; return { ...p, reactions }; } const comments=p.comments.map(c=>{ if(r.entity_type==='comment' && c.id===r.entity_id){ const reactions={...c.reactions}; const arr=reactions[r.reaction_type]||[]; if(!arr.includes(r.user_id)) reactions[r.reaction_type]=[...arr,r.user_id]; return { ...c, reactions }; } const replies=c.replies.map(rv=>{ if(r.entity_type==='reply' && rv.id===r.entity_id){ const reactions={...rv.reactions}; const arr=reactions[r.reaction_type]||[]; if(!arr.includes(r.user_id)) reactions[r.reaction_type]=[...arr,r.user_id]; return { ...rv, reactions }; } return rv; }); return { ...c, replies }; }); return { ...p, comments }; })); })
      .on('postgres_changes', { event:'DELETE', schema:'public', table:'reactions' }, payload=>{ const o=payload.old; setPosts(prev=> prev.map(p=> { if(o.entity_type==='post' && p.id===o.entity_id){ const reactions={...p.reactions}; Object.keys(reactions).forEach(k=> reactions[k]=reactions[k].filter(uid=>uid!==o.user_id)); return { ...p, reactions }; } const comments=p.comments.map(c=>{ if(o.entity_type==='comment' && c.id===o.entity_id){ const reactions={...c.reactions}; Object.keys(reactions).forEach(k=> reactions[k]=reactions[k].filter(uid=>uid!==o.user_id)); return { ...c, reactions }; } const replies=c.replies.map(rv=>{ if(o.entity_type==='reply' && rv.id===o.entity_id){ const reactions={...rv.reactions}; Object.keys(reactions).forEach(k=> reactions[k]=reactions[k].filter(uid=>uid!==o.user_id)); return { ...rv, reactions }; } return rv; }); return { ...c, replies }; }); return { ...p, comments }; })); })
      .subscribe();
    channelRef.current = ch; return () => { supabase.removeChannel(ch); };
  }, [ensureProfiles]);

  // Fallback lightweight polling for missed new comments (in case realtime fails for some clients)
  const lastCommentCheckRef = useRef(0);
  useEffect(()=>{
    if(!posts.length) return; // nothing loaded yet
    const interval = setInterval(async ()=>{
      // Only poll if at least 5s since last check and no pending refreshes
      const now = Date.now();
      if(now - lastCommentCheckRef.current < 5000) return;
      lastCommentCheckRef.current = now;
      // Collect post ids & latest timestamp
      const postIds = posts.map(p=>p.id);
      const latestTs = posts.reduce((max,p)=>{
        const m = p.comments.reduce((cm,c)=> Math.max(cm, new Date(c.createdAt).getTime()), 0);
        return Math.max(max,m);
      }, 0);
      const since = latestTs ? new Date(latestTs - 1000).toISOString() : null; // subtract 1s buffer
      let query = supabase.from('comments').select('*').in('post_id', postIds).order('created_at', { ascending:true }).limit(200);
      if(since) query = query.gt('created_at', since);
      const { data: newComments, error } = await query;
      if(error || !newComments || !newComments.length) return;
      const toAddByPost = {};
      newComments.forEach(c=>{ if(!toAddByPost[c.post_id]) toAddByPost[c.post_id]=[]; toAddByPost[c.post_id].push(c); });
      const newIds = newComments.map(c=>c.id);
      // Fetch reactions for new comments
      let rx=[]; if(newIds.length){ const { data: rxData } = await supabase.from('reactions').select('*').in('entity_id', newIds); rx = rxData||[]; }
      const rxMap={}; rx.forEach(r=>{ if(!rxMap[r.entity_id]) rxMap[r.entity_id]={ like:[], love:[], haha:[], wow:[], sad:[], angry:[] }; rxMap[r.entity_id][r.reaction_type]=[...rxMap[r.entity_id][r.reaction_type], r.user_id]; });
      setPosts(prev => prev.map(p=>{
        const adds = toAddByPost[p.id];
        if(!adds) return p;
        // Skip ones already present
        const existingIds = new Set(p.comments.map(c=>c.id));
        const augmented = adds.filter(c=> !existingIds.has(c.id)).map(c=>({ id:c.id, authorId:c.author_id, content:c.content||'', image:c.image_url||null, createdAt:c.created_at, updatedAt:c.updated_at, deleted:c.deleted, reactions:rxMap[c.id]||{...DEFAULT_REACTIONS}, replies:[] }));
        if(!augmented.length) return p;
        return { ...p, comments: [...p.comments, ...augmented] };
      }));
      ensureProfiles(newComments.map(c=>c.author_id));
    }, 3000); // poll every 3s (gated by 5s recency guard)
    return ()=> clearInterval(interval);
  }, [posts, ensureProfiles]);

  // Actions
  async function createPost(content, images=[]) { if(!user) throw new Error('Chưa đăng nhập'); const { error } = await supabase.from('posts').insert({ author_id:user.id, content:content.trim(), images }); if(error) throw error; }
  async function updatePost(id, { content, images=[] }) { if(!user) throw new Error('Chưa đăng nhập'); const { error } = await supabase.from('posts').update({ content:content.trim(), images, updated_at:new Date().toISOString() }).eq('id', id); if(error) throw error; }
  async function deletePost(id){ await supabase.from('posts').update({ deleted:true, deleted_at:new Date().toISOString() }).eq('id', id); }
  async function restorePost(id){ await supabase.from('posts').update({ deleted:false, deleted_at:null }).eq('id', id); }
  async function hardDeletePost(id){ await supabase.from('posts').delete().eq('id', id); }
  // Optimistic addComment: immediately append pending item, replace when DB row (via select or realtime) arrives
  function buildOptimisticComment(tempId, content, image){
    return { id: tempId, pending:true, tempLocalId: tempId, authorId:user.id, content:content.trim(), image:image||null, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), deleted:false, reactions:{...DEFAULT_REACTIONS}, replies:[] };
  }
  function replacePendingWithReal(postId, tempId, realRow){
    setPosts(prev=> prev.map(p=> { if(p.id!==postId) return p; const already = p.comments.some(c=>c.id===realRow.id); let comments = p.comments.map(c=> c.id===tempId ? { id:realRow.id, authorId:realRow.author_id, content:realRow.content||'', image:realRow.image_url||null, createdAt:realRow.created_at, updatedAt:realRow.updated_at, deleted:realRow.deleted, reactions:{...DEFAULT_REACTIONS}, replies:[], pending:false } : c); if(already) comments = comments.filter(c=> c.id!==tempId); return { ...p, comments }; }));
    clearPendingTimer(tempId);
  }
  function timeoutReconcile(postId, tempId){
    // If still pending after timeout, force refresh of that post to reconcile missing realtime event
    setPosts(prev=> prev.map(p=> { if(p.id!==postId) return p; return p; }));
    refreshPost(postId);
  }
  async function addComment(postId, content, image=null){
    if(!user) throw new Error('Chưa đăng nhập');
    const trimmed=(content||'').trim(); if(!trimmed && !image) return;
    const tempId='temp-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const optimistic = buildOptimisticComment(tempId, trimmed, image);
    setPosts(prev=> prev.map(p=> p.id===postId? { ...p, comments:[...p.comments, optimistic] } : p));
    ensureProfiles([user.id]);
    // Direct insert with returning row for immediate reconciliation
    try {
      const { data, error } = await supabase.from('comments').insert({ post_id:postId, author_id:user.id, content:trimmed, image_url:image }).select().single();
      if(error) throw error;
      if(data){ replacePendingWithReal(postId, tempId, data); }
    } catch(err){
      console.warn('addComment error', err);
      setPosts(prev=> prev.map(p=> p.id===postId? { ...p, comments: p.comments.map(c=> c.id===tempId? { ...c, failed:true, pending:false }: c) } : p));
      // fallback refresh attempt (maybe row inserted but select blocked) after short delay
      setTimeout(()=> refreshPost(postId), 1000);
      throw err;
    }
    // safety: clear pending if something weird after 5s (shouldn't happen when select works)
    pendingTimersRef.current[tempId] = setTimeout(()=> finalizePending(postId, tempId), 5000);
  }

  function finalizePending(postId, tempId){
    setPosts(prev=> prev.map(p=> { if(p.id!==postId) return p; return { ...p, comments: p.comments.map(c=> c.id===tempId && c.pending? { ...c, pending:false, stale:true }: c) }; }));
    refreshPost(postId);
  }
  async function updateComment(id, content){ await supabase.from('comments').update({ content:content.trim(), updated_at:new Date().toISOString() }).eq('id', id); }
  async function deleteComment(id){ await supabase.from('comments').update({ deleted:true, deleted_at:new Date().toISOString() }).eq('id', id); }
  // UI compatibility wrappers (expects (postId, commentId, ...))
  async function updateCommentUI(postId, commentId, content){ return updateComment(commentId, content); }
  async function deleteCommentUI(postId, commentId){ return deleteComment(commentId); }
  async function addReply(commentId, content, image=null){ if(!user) throw new Error('Chưa đăng nhập'); const { error } = await supabase.from('replies').insert({ comment_id:commentId, author_id:user.id, content:content.trim(), image_url:image }); if(error) throw error; }
  async function updateReply(id, content){ await supabase.from('replies').update({ content:content.trim(), updated_at:new Date().toISOString() }).eq('id', id); }
  async function deleteReply(id){ await supabase.from('replies').update({ deleted:true, deleted_at:new Date().toISOString() }).eq('id', id); }
  // --- Optimistic reaction utilities ---
  function mutateEntityReactions(entityType, entityId, mutateFn){
    setPosts(prev => prev.map(p => {
      if(entityType==='post'){
        if(p.id!==entityId) return p; return { ...p, reactions: mutateFn(p.reactions) };
      }
      const comments = p.comments.map(c => {
        if(entityType==='comment' && c.id===entityId){ return { ...c, reactions: mutateFn(c.reactions) }; }
        const replies = c.replies.map(r => entityType==='reply' && r.id===entityId ? { ...r, reactions: mutateFn(r.reactions) } : r);
        return { ...c, replies };
      });
      return { ...p, comments };
    }));
  }
  function getEntityReactions(entityType, entityId){
    for(const p of posts){
      if(entityType==='post' && p.id===entityId) return p.reactions;
      for(const c of p.comments){
        if(entityType==='comment' && c.id===entityId) return c.reactions;
        for(const r of c.replies){ if(entityType==='reply' && r.id===entityId) return r.reactions; }
      }
    }
    return { ...DEFAULT_REACTIONS };
  }
  async function setReaction(entityType, entityId, reactionType){
    if(!user) throw new Error('Chưa đăng nhập');
    // Defensive: if entityType looks like a UUID and reactionType looks like entityId swapped, attempt auto-correct
    const uuidRegex = /^[0-9a-fA-F-]{32,}$/;
    if(uuidRegex.test(entityType) && ['post','comment','reply'].includes(entityId)){
      // likely swapped first two args
      const tmp = entityType; // actually entityId
      entityType = entityId;  // correct entityType
      entityId = tmp;         // correct entityId
    }
    if(!['post','comment','reply'].includes(entityType)) throw new Error('Loại entity không hợp lệ');
    if(!DEFAULT_REACTIONS[reactionType]) throw new Error('Loại reaction không hợp lệ');
    const before = getEntityReactions(entityType, entityId);
    const alreadySame = (before[reactionType]||[]).includes(user.id);
    if(alreadySame){
      // Treat clicking again as remove (toggle off)
      mutateEntityReactions(entityType, entityId, (rx)=>{
        const updated = Object.fromEntries(Object.keys(DEFAULT_REACTIONS).map(k=> [k, (rx[k]||[]).filter(uid=> uid!==user.id)]));
        return updated;
      });
      try {
        await supabase.from('reactions').delete().eq('entity_type', entityType).eq('entity_id', entityId).eq('user_id', user.id);
      } catch(err){
        mutateEntityReactions(entityType, entityId, ()=>before); // rollback
        throw err;
      }
      return;
    }
    // Not same -> replace whatever previous reaction (if any) with new one
    mutateEntityReactions(entityType, entityId, (rx)=>{
      const updated = Object.fromEntries(Object.keys(DEFAULT_REACTIONS).map(k=> [k, (rx[k]||[]).filter(uid=> uid!==user.id)]));
      updated[reactionType] = [...updated[reactionType], user.id];
      return updated;
    });
    try {
      await supabase.from('reactions').delete().eq('entity_type', entityType).eq('entity_id', entityId).eq('user_id', user.id);
      const { error } = await supabase.from('reactions').insert({ entity_type:entityType, entity_id:entityId, user_id:user.id, reaction_type:reactionType });
      if(error) throw error;
    } catch(err){
      mutateEntityReactions(entityType, entityId, ()=>before); // rollback
      throw err;
    }
  }
  async function toggleReaction(entityType, entityId, reactionType){
    if(!user) throw new Error('Chưa đăng nhập');
    const uuidRegex = /^[0-9a-fA-F-]{32,}$/;
    if(uuidRegex.test(entityType) && ['post','comment','reply'].includes(entityId)){
      const tmp = entityType; entityType = entityId; entityId = tmp;
    }
    if(!['post','comment','reply'].includes(entityType)) throw new Error('Loại entity không hợp lệ');
    if(!DEFAULT_REACTIONS[reactionType]) throw new Error('Loại reaction không hợp lệ');
    const current = getEntityReactions(entityType, entityId);
    const has = (current[reactionType]||[]).includes(user.id);
    const before = current;
    if(has){
      // optimistic remove
      mutateEntityReactions(entityType, entityId, (rx)=>{ const clone = Object.fromEntries(Object.keys(DEFAULT_REACTIONS).map(k=> [k, [...(rx[k]||[])]])); clone[reactionType] = clone[reactionType].filter(uid=> uid!==user.id); return clone; });
      try {
        await supabase.from('reactions').delete().eq('entity_type', entityType).eq('entity_id', entityId).eq('user_id', user.id).eq('reaction_type', reactionType);
      } catch(err){ mutateEntityReactions(entityType, entityId, ()=>before); throw err; }
    } else {
      // act like setReaction
      await setReaction(entityType, entityId, reactionType);
    }
  }

  // Wrapper helpers expected by UI (keep signatures used in PostItem.jsx)
  async function addReplyUI(postId, commentId, content, image){ return addReply(commentId, content, image); }
  async function updateReplyUI(postId, commentId, replyId, content){ return updateReply(replyId, content); }
  async function deleteReplyUI(postId, commentId, replyId){ return deleteReply(replyId); }

  // --- Backward compatibility helpers (legacy UI expects these) ---
  const refreshingRef = useRef({});
  async function refreshPost(postId){
    // simple re-fetch of a single post tree
    if(!postId) return;
    try {
      refreshingRef.current[postId] = true;
      const { data: postRow } = await supabase.from('posts').select('*').eq('id', postId).single();
      if(!postRow) return;
      const { data: comments } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at',{ascending:true});
      const commentIds = (comments||[]).map(c=>c.id);
      let replies=[]; if(commentIds.length){ const { data } = await supabase.from('replies').select('*').in('comment_id', commentIds).order('created_at',{ascending:true}); replies=data||[]; }
      const entityIds=[postId, ...commentIds, ...replies.map(r=>r.id)];
      let rx=[]; if(entityIds.length){ const { data } = await supabase.from('reactions').select('*').in('entity_id', entityIds); rx=data||[]; }
      const rxMap={}; rx.forEach(r=>{ if(!rxMap[r.entity_id]) rxMap[r.entity_id]={ like:[], love:[], haha:[], wow:[], sad:[], angry:[] }; rxMap[r.entity_id][r.reaction_type]=[...rxMap[r.entity_id][r.reaction_type], r.user_id]; });
      const repliesByComment={}; replies.forEach(r=>{ if(!repliesByComment[r.comment_id]) repliesByComment[r.comment_id]=[]; repliesByComment[r.comment_id].push({ id:r.id, authorId:r.author_id, content:r.content||'', image:r.image_url||null, createdAt:r.created_at, updatedAt:r.updated_at, deleted:r.deleted, reactions:rxMap[r.id]||{...DEFAULT_REACTIONS} }); });
      const commentsFull=(comments||[]).map(c=>({ id:c.id, authorId:c.author_id, content:c.content||'', image:c.image_url||null, createdAt:c.created_at, updatedAt:c.updated_at, deleted:c.deleted, reactions:rxMap[c.id]||{...DEFAULT_REACTIONS}, replies:repliesByComment[c.id]||[] }));
      // Merge with any local pending comments not yet reconciled
      setPosts(prev => prev.map(p => {
        if(p.id!==postId) return p;
        const pending = p.comments.filter(c=> c.pending);
        // avoid duplicates by content+author match
        const merged = [...commentsFull];
        pending.forEach(c=> { if(!merged.some(rc=> rc.authorId===c.authorId && rc.content===c.content)){ merged.push(c); } });
        return { id:postRow.id, authorId:postRow.author_id, content:postRow.content||'', images:postRow.images||[], createdAt:postRow.created_at, updatedAt:postRow.updated_at, deleted:postRow.deleted, reactions:rxMap[postRow.id]||{...DEFAULT_REACTIONS}, comments: merged.sort((a,b)=> new Date(a.createdAt)-new Date(b.createdAt)) };
      }));
    } finally {
      delete refreshingRef.current[postId];
    }
  }
  function isRefreshing(postId){ return !!refreshingRef.current[postId]; }

  // Reaction helper wrappers (single-user replacement logic) for UI pickers
  async function choosePostReaction(postId, type){ await setReaction('post', postId, type); }
  async function togglePostReaction(postId, type){ await toggleReaction('post', postId, type); }
  async function chooseCommentReaction(postId, commentId, type){ await setReaction('comment', commentId, type); }
  async function toggleCommentReaction(postId, commentId, type){ await toggleReaction('comment', commentId, type); }
  async function chooseReplyReaction(postId, commentId, replyId, type){ await setReaction('reply', replyId, type); }
  async function toggleReplyReaction(postId, commentId, replyId, type){ await toggleReaction('reply', replyId, type); }

  // usersMap fallback -> use profiles (legacy component expects usersMap)
  const usersMap = profiles;

  const value = { posts, loading, profiles, usersMap, createPost, updatePost, deletePost, restorePost, hardDeletePost, addComment, updateComment: updateCommentUI, deleteComment: deleteCommentUI, addReply: addReplyUI, updateReply: updateReplyUI, deleteReply: deleteReplyUI, setReaction, toggleReaction, refreshPost, isRefreshing, choosePostReaction, togglePostReaction, chooseCommentReaction, toggleCommentReaction, chooseReplyReaction, toggleReplyReaction };
  return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
}

export function usePosts(){ return useContext(PostContext); }
