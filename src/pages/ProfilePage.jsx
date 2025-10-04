import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { usePosts } from '../context/PostContext.jsx';
import { PostItem } from '../components/PostItem.jsx';
import { PostComposer } from '../components/PostComposer.jsx';
import { formatDistanceToNow } from '../utils/formatDistance.js';

export function ProfilePage(){
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateProfile, updateCover, changePassword, loading } = useAuth();
  const { posts, usersMap } = usePosts();
  const profileUser = id ? usersMap[id] : user;
  useEffect(()=>{ if(!loading && id && !profileUser){ navigate('/profile'); } }, [id, profileUser, loading, navigate]);
  const isOwner = profileUser && user && profileUser.id === user.id;
  const [activeTab, setActiveTab] = useState('posts');
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(profileUser?.bio || '');
  const [nameDraft, setNameDraft] = useState(profileUser?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [pwErr, setPwErr] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  useEffect(()=>{ setBioDraft(profileUser?.bio||''); setNameDraft(profileUser?.name||''); }, [profileUser?.bio, profileUser?.name]);

  function pickFile(ref){ ref.current?.click(); }
  function readFile(file, cb){ if(!file) return; if(file.size>2*1024*1024) return; const r=new FileReader(); r.onload=e=>cb(e.target.result); r.readAsDataURL(file); }
  function onAvatarChange(e){ const f=e.target.files?.[0]; if(!f) return; setAvatarUploading(true); readFile(f, async data=>{ await updateProfile({ avatar: data }); setAvatarUploading(false); }); }
  function onCoverChange(e){ const f=e.target.files?.[0]; if(!f) return; setCoverUploading(true); readFile(f, async data=>{ await updateCover(data); setCoverUploading(false); }); }
  async function saveBio(){ await updateProfile({ bio: bioDraft }); setEditingBio(false); }
  async function saveName(){ setSavingName(true); await updateProfile({ name: nameDraft||profileUser.email }); setSavingName(false); }
  async function changePw(e){ e.preventDefault(); setPwErr(null); setPwMsg(null); if(newPw.length<4){ setPwErr('Mật khẩu quá ngắn'); return; } if(newPw!==newPw2){ setPwErr('Nhập lại không khớp'); return; } try{ await changePassword({ oldPassword: oldPw, newPassword: newPw }); setPwMsg('Đổi mật khẩu thành công'); setOldPw(''); setNewPw(''); setNewPw2(''); } catch(err){ setPwErr(err.message); } }

  const userPosts = posts.filter(p=> p.authorId === profileUser?.id);
  const allImages = userPosts.flatMap(p=> p.images.map((img,i)=> ({ src: img, postId: p.id, idx: i })));

  if(!profileUser) return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-gray-500">Không tìm thấy người dùng</div>;

  return (
    <div className="min-h-screen">
      {/* Cover Section */}
      <div className="relative w-full bg-gray-300 dark:bg-gray-700 aspect-[3/1] md:aspect-[3.5/1] overflow-hidden">
        {profileUser.cover ? <img src={profileUser.cover} alt="cover" className="w-full h-full object-cover" /> : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">Chưa có ảnh bìa</div>
        )}
        {isOwner && (
          <button onClick={()=>pickFile(coverInputRef)} className="absolute bottom-3 right-3 px-3 py-2 rounded-md text-xs font-medium bg-black/60 text-white hover:bg-black/70 backdrop-blur-sm flex items-center gap-1">
            {coverUploading? 'Đang tải...' : 'Đổi ảnh bìa'}
          </button>
        )}
        <input ref={coverInputRef} onChange={onCoverChange} type="file" accept="image/*" className="hidden" />
      </div>
      {/* Avatar + Basic Info Card */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="relative group w-40 h-40 rounded-full ring-4 ring-white dark:ring-black shadow-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-green-500 to-green-600 text-white text-4xl font-bold flex items-center justify-center">
            {profileUser.avatar ? <img src={profileUser.avatar} alt="avatar" className="w-full h-full object-cover" /> : (profileUser.name||profileUser.email||'?').charAt(0).toUpperCase()}
            {isOwner && (
              <button onClick={()=>pickFile(avatarInputRef)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold transition">Đổi ảnh</button>
            )}
            <input ref={avatarInputRef} onChange={onAvatarChange} type="file" accept="image/*" className="hidden" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-3">
                <input disabled={!isOwner} value={nameDraft} onChange={e=>setNameDraft(e.target.value)} className={`text-2xl md:text-3xl font-bold bg-transparent border-b focus:outline-none focus:border-green-500 ${isOwner? 'border-gray-300 dark:border-gray-600':'border-transparent'} pb-1`} />
                {isOwner && <button onClick={saveName} disabled={savingName} className="text-xs px-3 py-1.5 rounded-md bg-green-600 text-white disabled:opacity-50">{savingName?'Lưu...':'Lưu'}</button>}
              </div>
              <div className="text-xs text-gray-500">Tham gia {formatDistanceToNow(profileUser.createdAt)}</div>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {editingBio ? (
                <div className="space-y-2">
                  <textarea value={bioDraft} onChange={e=>setBioDraft(e.target.value)} rows={3} className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Viết đôi lời giới thiệu..." />
                  <div className="flex gap-2">
                    <button onClick={saveBio} className="px-4 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold">Lưu</button>
                    <button onClick={()=>{ setEditingBio(false); setBioDraft(profileUser.bio||''); }} className="px-4 py-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-xs">Hủy</button>
                  </div>
                </div>
              ) : (
                <div>
                  {profileUser.bio ? <p className="leading-relaxed whitespace-pre-wrap break-words">{profileUser.bio}</p> : <p className="text-gray-400 text-sm italic">Chưa có giới thiệu.</p>}
                  {isOwner && <button onClick={()=>setEditingBio(true)} className="mt-2 text-xs font-medium text-green-600 hover:underline">Chỉnh sửa giới thiệu</button>}
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {isOwner && <button onClick={()=>setPwOpen(o=>!o)} className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium">Đổi mật khẩu</button>}
              {!isOwner && <button className="px-4 py-2 rounded-md bg-green-600 text-white text-xs font-medium">Nhắn tin</button>}
            </div>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 mt-8">
        <div className="border-b border-gray-200 dark:border-gray-700 flex gap-6 overflow-x-auto">
          {['posts','about','photos'].map(t => (
            <button key={t} onClick={()=>setActiveTab(t)} className={`py-3 -mb-px px-1 border-b-2 text-sm font-medium transition ${activeTab===t? 'border-green-600 text-green-600 dark:text-green-400':'border-transparent text-gray-500 hover:text-green-600'} capitalize`}>{t==='posts'?'Bài viết': t==='about'? 'Giới thiệu':'Ảnh'}</button>
          ))}
        </div>
        <div className="mt-6">
          {activeTab==='posts' && (
            <div className="space-y-6">
              {isOwner && <PostComposer />}
              {userPosts.length? userPosts.map(p=> <PostItem key={p.id} post={p} />) : <div className="text-sm text-gray-500">Chưa có bài viết.</div>}
            </div>
          )}
          {activeTab==='about' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-2">
                <h3 className="text-sm font-semibold mb-3">Thông tin cơ bản</h3>
                <div className="text-xs text-gray-600 dark:text-gray-300">Email: <span className="font-medium">{profileUser.email}</span></div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Tham gia: <span className="font-medium">{new Date(profileUser.createdAt).toLocaleDateString()}</span></div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Bài viết: <span className="font-medium">{userPosts.length}</span></div>
              </div>
              <div className="bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold">Giới thiệu</h3>
                {!editingBio && profileUser.bio && <p className="text-sm whitespace-pre-wrap break-words">{profileUser.bio}</p>}
                {isOwner && !editingBio && <button onClick={()=>setEditingBio(true)} className="text-xs text-green-600 hover:underline">Chỉnh sửa</button>}
                {editingBio && (
                  <div className="space-y-2">
                    <textarea value={bioDraft} onChange={e=>setBioDraft(e.target.value)} rows={4} className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <div className="flex gap-2">
                      <button onClick={saveBio} className="px-4 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold">Lưu</button>
                      <button onClick={()=>{ setEditingBio(false); setBioDraft(profileUser.bio||''); }} className="px-4 py-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-xs">Hủy</button>
                    </div>
                  </div>
                )}
              </div>
              {isOwner && (
                <div className="md:col-span-2 bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                  <button onClick={()=>setPwOpen(o=>!o)} className="text-xs font-medium text-green-600 hover:underline">{pwOpen?'Ẩn đổi mật khẩu':'Đổi mật khẩu'}</button>
                  {pwOpen && (
                    <form onSubmit={changePw} className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
                      <input type="password" value={oldPw} onChange={e=>setOldPw(e.target.value)} placeholder="Mật khẩu hiện tại" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Mật khẩu mới" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input type="password" value={newPw2} onChange={e=>setNewPw2(e.target.value)} placeholder="Nhập lại" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500" />
                      {pwErr && <div className="text-xs text-red-500 md:col-span-3">{pwErr}</div>}
                      {pwMsg && <div className="text-xs text-green-600 md:col-span-3">{pwMsg}</div>}
                      <div className="md:col-span-3"><button className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">Đổi mật khẩu</button></div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
          {activeTab==='photos' && (
            <div>
              {allImages.length ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {allImages.map((img,i)=>(
                    <div key={i} className="relative aspect-square overflow-hidden rounded-lg group bg-black/5">
                      <img src={img.src} alt={'pimg'+i} className="w-full h-full object-cover group-hover:scale-110 transition" />
                    </div>
                  ))}
                </div>
              ) : <div className="text-sm text-gray-500">Chưa có ảnh.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
