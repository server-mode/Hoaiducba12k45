import React, { useEffect } from 'react';

export function DetailsPanel({ member, onClose }) {
  useEffect(() => {
    function esc(e){ if(e.key === 'Escape') onClose?.(); }
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  if(!member) return null;
  const onErr = (e) => { e.target.onerror=null; e.target.src='https://placehold.co/200x200/cccccc/ffffff?text=No+Image'; };
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full w-full md:w-1/3 bg-white/40 dark:bg-black/60 backdrop-blur-lg border-l border-gray-200 dark:border-gray-700 shadow-2xl z-50 p-8 overflow-y-auto" role="dialog" aria-modal="true">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors" aria-label="Đóng">✕</button>
        <div className="text-center pt-8">
          <img src={member.avatar} onError={onErr} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-green-400 object-cover shadow-lg" />
          <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">{member.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">{member.nickname}</p>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-left">{member.bio}</p>
            {member.quote && <blockquote className="border-l-4 border-green-200 dark:border-green-700 pl-4 italic text-gray-600 dark:text-gray-400 mb-6 text-left"><p>"{member.quote}"</p></blockquote>}
            <div className="flex justify-center space-x-4">
              {member.social?.facebook && <a href={member.social.facebook} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">FB</a>}
              {member.social?.instagram && <a href={member.social.instagram} target="_blank" rel="noreferrer" className="text-pink-600 hover:text-pink-800">IG</a>}
              {member.social?.tiktok && <a href={member.social.tiktok} target="_blank" rel="noreferrer" className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300">TT</a>}
            </div>
        </div>
      </aside>
    </>
  );
}
