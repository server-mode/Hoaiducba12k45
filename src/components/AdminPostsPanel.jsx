import React, { useState, useMemo } from 'react';
import { usePosts } from '../context/PostContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDistanceToNow } from '../utils/formatDistance.js';

export function AdminPostsPanel(){
  const { posts } = usePosts();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const filtered = useMemo(()=> posts.filter(p=>{
    if(!q) return true;
    return (p.content||'').toLowerCase().includes(q.toLowerCase()) || p.id.includes(q);
  }), [posts, q]);
  if(!user?.isAdmin) return null;
  return (
    <div className="mt-12">
      <h2 className="text-lg font-semibold mb-4">Tất cả bài viết (kể cả đã xoá)</h2>
      <div className="flex gap-3 mb-4">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm nội dung hoặc ID..." className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <th className="p-2 text-left">ID</th>
              <th className="p-2 text-left">Tác giả</th>
              <th className="p-2 text-left">Trạng thái</th>
              <th className="p-2 text-left">Ngày tạo</th>
              <th className="p-2 text-left">Sửa cuối</th>
              <th className="p-2 text-left">Ảnh</th>
              <th className="p-2 text-left">Nội dung (rút gọn)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p=> (
              <tr key={p.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="p-2 font-mono max-w-[120px] truncate" title={p.id}>{p.id}</td>
                <td className="p-2">{p.authorId}</td>
                <td className="p-2">{p.deleted? 'Đã xoá' : 'Hiển thị'}</td>
                <td className="p-2">{formatDistanceToNow(p.createdAt)}</td>
                <td className="p-2">{p.updatedAt? formatDistanceToNow(p.updatedAt): '-'}</td>
                <td className="p-2">{p.images?.length||0}</td>
                <td className="p-2 max-w-[260px] truncate" title={p.content}>{p.content||''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
