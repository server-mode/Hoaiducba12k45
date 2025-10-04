import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { usePosts } from '../context/PostContext.jsx';
import { AdminPostsPanel } from '../components/AdminPostsPanel.jsx';

export function AdminPage(){
  const { listUsers, adminUpdateUser, adminDeleteUser, user, getActivity } = useAuth();
  const { posts } = usePosts();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(()=> {
    let cancelled = false;
    (async () => {
      try {
        const data = await listUsers();
        if(!cancelled) setUsers(Array.isArray(data)? data: []);
      } finally { if(!cancelled) setLoadingUsers(false); }
    })();
    return () => { cancelled = true; };
  }, [listUsers]);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState('users'); // users | posts | security | server

  async function refresh(){
    setLoadingUsers(true);
    const data = await listUsers();
    setUsers(Array.isArray(data)? data: []);
    setLoadingUsers(false);
  }
  function toggleSuspend(u){ adminUpdateUser(u.id, { suspended: !u.suspended }); refresh(); }
  function del(u){ if(confirm('Xóa user và toàn bộ nội dung?')){ adminDeleteUser(u.id); refresh(); } }
  function totalImages(uId){ return posts.filter(p=>p.authorId===uId).reduce((a,p)=> a + (p.images?.length||0), 0); }
  function totalPosts(uId){ return posts.filter(p=>p.authorId===uId).length; }
  const displayed = (Array.isArray(users)? users: []).filter(u=> {
    if(!filter) return true;
    const f = filter.toLowerCase();
    return (u.email||'').toLowerCase().includes(f) || (u.name||'').toLowerCase().includes(f);
  });

  const summary = useMemo(()=>({ users: (Array.isArray(users)? users.length:0), posts: posts.length }), [users, posts]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Bảng điều khiển Admin</h1>
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6 text-sm">
        {['users','posts','security','server'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`py-2 px-3 -mb-px border-b-2 ${tab===t? 'border-green-600 text-green-600 dark:text-green-400':'border-transparent text-gray-500 hover:text-green-600'}`}>{t==='users'?'Người dùng': t==='posts'?'Bài viết': t==='security'?'Bảo mật':'Server'}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow">
          <div className="text-gray-500 text-[11px]">Người dùng</div>
          <div className="text-lg font-semibold">{summary.users}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow">
          <div className="text-gray-500 text-[11px]">Bài viết</div>
          <div className="text-lg font-semibold">{summary.posts}</div>
        </div>
      </div>
    {tab==='users' && (
        <div>
      {loadingUsers && <div className="text-xs text-gray-500 mb-2">Đang tải người dùng...</div>}
          <div className="flex items-center gap-3 mb-4">
            <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Tìm người dùng..." className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" />
            <button onClick={refresh} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-xs">Tải lại</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  <th className="p-2 text-left">Tên</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2">Admin</th>
                  <th className="p-2">Khóa</th>
                  <th className="p-2">Bài viết</th>
                  <th className="p-2">Ảnh</th>
                  <th className="p-2">Upload (KB)</th>
                  <th className="p-2">Lần đăng nhập</th>
                  <th className="p-2">Tần suất xem bài</th>
                  <th className="p-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(u=> {
                  const act = getActivity(u.id);
                  const loginCount = act?.logins?.length || 0;
                  // derive most viewed posts
                  let freq = '-';
                  if(act?.viewedPosts){
                    const arr = Object.entries(act.viewedPosts).map(([pid,val])=>({pid, ...val})).sort((a,b)=> b.count - a.count).slice(0,2);
                    freq = arr.length? arr.map(x=> `${x.pid.substring(0,4)}…(${x.count})`).join(', ') : '-';
                  }
                  return (
                    <tr key={u.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-2 font-medium max-w-[140px] truncate">{u.name}</td>
                      <td className="p-2 max-w-[160px] truncate">{u.email}</td>
                      <td className="p-2 text-center">{u.isAdmin? '✓':''}</td>
                      <td className="p-2 text-center">{u.suspended? '🚫':''}</td>
                      <td className="p-2 text-center">{totalPosts(u.id)}</td>
                      <td className="p-2 text-center">{totalImages(u.id)}</td>
                      <td className="p-2 text-center">{Math.round((u.uploadBytes||0)/1024)}</td>
                      <td className="p-2 text-center">{loginCount}</td>
                      <td className="p-2 text-center">{freq}</td>
                      <td className="p-2 flex gap-2 flex-wrap min-w-[140px]">
                        <button onClick={()=>toggleSuspend(u)} disabled={u.id===user.id} className="px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-700/40 text-yellow-700 dark:text-yellow-200">{u.suspended? 'Mở khóa':'Khóa'}</button>
                        <button onClick={()=> del(u)} disabled={u.isAdmin} className="px-2 py-1 rounded bg-red-100 dark:bg-red-700/40 text-red-700 dark:text-red-200 disabled:opacity-40">Xóa</button>
                        <button onClick={()=> { try { adminUpdateUser(u.id, { isAdmin: !u.isAdmin }); refresh(); } catch(err){ alert(err.message); } }} disabled={u.id===user.id && u.isAdmin} className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-700/40 text-blue-700 dark:text-blue-200 disabled:opacity-40">{u.isAdmin? 'Gỡ':'Thêm'}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[10px] text-gray-500">(*) IP/Vị trí và mật khẩu thực tế không thể lấy an toàn ở client. Cần backend + hashing.</p>
        </div>
      )}
      {tab==='posts' && (
        <div>
          <AdminPostsPanel />
        </div>
      )}
      {tab==='security' && (
        <div className="space-y-4 text-xs">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h2 className="font-semibold mb-2 text-sm">Tổng quan bảo mật (client)</h2>
            <ul className="list-disc ml-5 space-y-1">
              <li>CSP cơ bản đã bật</li>
              <li>Rate limit phía client (bài viết / bình luận)</li>
              <li>Không thể hiển thị mật khẩu người dùng (đang hash base64) - cần thay Argon2</li>
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold mb-2 text-sm">Hành động cần làm (server)</h3>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Dựng backend + JWT/Refresh</li>
              <li>Hash Argon2id mật khẩu</li>
              <li>Ghi log IP & User-Agent thực</li>
              <li>Áp dụng WAF / CDN</li>
              <li>Thêm audit log cho thay đổi quyền</li>
            </ol>
          </div>
        </div>
      )}
      {tab==='server' && (
        <div className="space-y-4 text-xs">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h2 className="font-semibold mb-2 text-sm">Tình trạng server (giả lập)</h2>
            <p>Chưa có backend thực. Gợi ý: Express/Nest + Postgres + Prisma.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold mb-2 text-sm">Kế hoạch triển khai</h3>
            <p>1. Khởi tạo repo server riêng. 2. Module auth. 3. Module posts. 4. Audit + monitoring.</p>
          </div>
        </div>
      )}
    </div>
  );
}
