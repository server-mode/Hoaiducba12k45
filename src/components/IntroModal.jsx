import React, { useEffect, useRef } from 'react';

export function IntroModal({ open, onClose }){
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    function onKey(e){ if(e.key === 'Escape') onClose(); }
    if(open){
      document.addEventListener('keydown', onKey);
      setTimeout(()=>{ closeBtnRef.current?.focus(); }, 30);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      if(!open) document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if(!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-start md:items-center justify-center p-4 md:p-8 modal-intro-wrapper">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={dialogRef} role="dialog" aria-modal="true" className="relative max-h-[90vh] overflow-y-auto w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl ring-1 ring-green-500/20 animate-scaleFade">
        <div className="flex justify-between items-start p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">Giới Thiệu A12K45</h2>
          <button ref={closeBtnRef} onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full p-2" aria-label="Đóng giới thiệu">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-12">
          <section>
            <h3 className="text-3xl font-extrabold mb-6 text-green-600 dark:text-green-400">A12K45 Là Ai?</h3>
            <p className="leading-relaxed text-lg text-gray-700 dark:text-gray-300 mb-4">A12K45 là một tập thể học sinh đầy năng lượng của Trường THPT Hoài Đức B – nơi mà tinh thần đoàn kết, trách nhiệm và khát vọng học tập luôn được đặt lên hàng đầu. Chúng mình đến từ nhiều hoàn cảnh khác nhau nhưng gặp nhau ở cùng một mục tiêu: cùng tiến bộ, cùng tạo nên những ký ức khó quên của tuổi học trò.</p>
            <p className="leading-relaxed text-lg text-gray-700 dark:text-gray-300 mb-4">Với phương châm <span className="font-semibold italic text-green-600 dark:text-green-400">“Tôn trọng – Hỗ trợ – Vươn lên”</span>, lớp luôn khuyến khích mỗi cá nhân thể hiện thế mạnh riêng, đồng thời không để ai bị bỏ lại phía sau.</p>
          </section>
          <section>
            <h3 className="text-2xl font-bold mb-4">Giá Trị Nổi Bật</h3>
            <ul className="grid md:grid-cols-2 gap-6">
              <li className="p-5 bg-white dark:bg-gray-800/50 rounded-xl shadow border border-green-100 dark:border-gray-700"><h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">Tinh thần đoàn kết</h4><p className="text-sm leading-relaxed">Luôn sát cánh trong học tập, ngoại khóa và các hoạt động phong trào.</p></li>
              <li className="p-5 bg-white dark:bg-gray-800/50 rounded-xl shadow border border-green-100 dark:border-gray-700"><h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">Tôn trọng & sẻ chia</h4><p className="text-sm leading-relaxed">Xây dựng môi trường thân thiện, lắng nghe và hỗ trợ nhau.</p></li>
              <li className="p-5 bg-white dark:bg-gray-800/50 rounded-xl shadow border border-green-100 dark:border-gray-700"><h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">Kỷ luật & trách nhiệm</h4><p className="text-sm leading-relaxed">Ý thức giữ gìn nề nếp, chủ động trong mọi công việc chung.</p></li>
              <li className="p-5 bg-white dark:bg-gray-800/50 rounded-xl shadow border border-green-100 dark:border-gray-700"><h4 className="font-semibold mb-2 text-green-600 dark:text-green-400">Khát vọng học tập</h4><p className="text-sm leading-relaxed">Không ngừng phấn đấu để đạt kết quả tốt trong các kỳ thi.</p></li>
            </ul>
          </section>
          <section>
            <h3 className="text-2xl font-bold mb-4">Những Hoạt Động Tiêu Biểu</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-5 rounded-xl bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-900 border border-green-100 dark:border-gray-700 shadow"><h4 className="font-semibold mb-1">Học tập nâng cao</h4><p className="text-sm">Nhóm học tập theo môn, chia sẻ tài liệu và hỗ trợ ôn thi.</p></div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-900 border border-green-100 dark:border-gray-700 shadow"><h4 className="font-semibold mb-1">Hoạt động thiện nguyện</h4><p className="text-sm">Tham gia các chương trình gây quỹ và hỗ trợ cộng đồng.</p></div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-900 border border-green-100 dark:border-gray-700 shadow"><h4 className="font-semibold mb-1">Văn nghệ & thể thao</h4><p className="text-sm">Đội hình năng động góp mặt nhiều sự kiện của trường.</p></div>
            </div>
          </section>
          <section>
            <h3 className="text-2xl font-bold mb-4">Thông Điệp Gửi Tới Thành Viên Mới</h3>
            <div className="p-6 md:p-10 bg-white dark:bg-gray-800/60 rounded-2xl shadow relative overflow-hidden">
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,theme(colors.green.400),transparent_70%)]"></div>
              <p className="relative leading-relaxed text-lg">Nếu bạn là một phần của A12K45, bạn không chỉ là một học sinh trong lớp – bạn là một mảnh ghép quan trọng của một tập thể đang cùng nhau viết nên một câu chuyện đẹp. Hãy tự tin thể hiện, kết nối và cùng nhau tiến bộ!</p>
            </div>
          </section>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/60">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200">Đóng</button>
        </div>
      </div>
    </div>
  );
}
