# Tích hợp Supabase (Khung ban đầu)

## 1. Env
Tạo file `.env` (hoặc `.env.local`):
```
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

## 2. Client
`src/lib/supabaseClient.js` đã tạo.

## 3. Bật provider
Tùy chọn chuyển sang Supabase bằng flag trong `src/config/appConfig.js` (USE_SUPABASE=true).

## 4. AuthSupabaseContext
File `src/context/AuthSupabaseContext.jsx` cung cấp API tương tự: { user, register, login, logout, updateProfile, changePassword }.

## 5. Tiếp theo cần làm
- Thay PostContext sang dùng bảng posts (chưa chuyển trong commit này).
- Upload ảnh: dùng supabase.storage.from('media').upload.
- Reactions / comments: tạo service modules.
- Chính sách RLS đã mô tả ở README_SECURITY.md (cần chạy SQL trong Supabase).

## 6. Migration sơ bộ
Viết script đọc localStorage và dùng insert vào posts/comments sau khi người dùng đăng nhập (admin) – THỰC HIỆN MỘT LẦN rồi xóa.

## 7. Realtime (tuỳ chọn)
Dùng supabase.channel với postgres_changes để cập nhật feed trực tiếp.

## 8. Bảo mật
- Không dùng service role key trong frontend.
- Kiểm tra RLS với user thường vs admin.

## 9. Kết nối trực tiếp Postgres (server-side)
Không nhúng chuỗi kết nối Postgres vào React (frontend) vì sẽ lộ mật khẩu. Thay vào đó:
1. Tạo thư mục `server/` (đã thêm) và file `.env` (không commit) dựa trên `server/.env.example`.
2. Đặt biến: `SUPABASE_DB_CONNECTION=postgresql://postgres.lfnhvsigfcaimgiwbeyb:YOUR-PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`
3. Dùng `pg` pool trong `server/db.js` để thực thi truy vấn backend riêng (nếu cần logic server).
4. Mọi API nội bộ sẽ gọi Supabase DB qua pool này thay vì client JS ở trình duyệt.

## 10. Migration chính thức & Policies

File migration đã thêm: `supabase/migrations/0001_init.sql`

Chạy toàn bộ nội dung file đó trong SQL Editor của Supabase (schema public). Nó tạo:
- profiles, posts, comments, replies, reactions, audit_logs
- enum reaction_kind
- function is_admin(uid)
- indexes & RLS policies

### Lỗi PGRST205 khi đăng bài
Nếu gặp: `Could not find the table 'public.posts' in the schema cache`
=> Chưa chạy migration hoặc PostgREST chưa refresh schema.

Khắc phục:
1. Mở SQL Editor, chạy file 0001_init.sql
2. Vào phần API settings (hoặc Auth > Policies) bấm Refresh Schema (nếu cần)
3. Reload web app và thử tạo post lại.

### Kiểm tra nhanh trong Console
```
await supabase.from('posts').select('id').limit(1)
```
Nếu trả về error code PGRST205 => bảng chưa tồn tại.

### Thay đổi schema
Sau mỗi thay đổi bảng, có thể cần Refresh schema (ít khi cần, PostgREST tự cập nhật nhưng đôi khi chậm vài giây).

### Realtime (chưa kích hoạt)
Sau khi bảng sẵn sàng có thể tạo channel:
```
supabase.channel('realtime:posts')
	.on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => {...})
	.subscribe();
```
Nhớ bật Realtime cho bảng trong Dashboard nếu cần.


