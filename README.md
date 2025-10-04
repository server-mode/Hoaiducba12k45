# Giới Thiệu React Version

Dự án này chuyển đổi nội dung trong `gioithieu.html` + logic từ `script.js` sang ứng dụng React + Vite.

## Có gì đã port
- Layout + Hero 6 khung chữ A12K45 (rotator đơn giản)
- Danh sách thành viên với lazy loading + hiệu ứng xuất hiện
- Panel chi tiết thành viên (click thẻ để mở)
- Chế độ sáng/tối (lưu localStorage)
- CSS tùy chỉnh (parallelogram, glow, hero panes) tích hợp vào `index.css`

## Chưa port đầy đủ / khác biệt
- Bộ rotator đã được giản lược (không còn toàn bộ adaptive decode logic nâng cao)
- Chưa nén ảnh bằng canvas (dùng native `loading="lazy"` + lazy observer)
- Dataset `members` hiện mới lấy một phần (cần bổ sung hết nếu muốn)

## Thêm đủ dữ liệu thành viên
Sao chép phần còn lại của mảng `members` trong `script.js` vào `src/data/classData.js`.

## Ảnh & Tài nguyên
Sao chép tất cả file ảnh (*.png, *.jpg, *.webp) từ thư mục gốc vào `gioithieu-react/public/` rồi chạy dev.

Ví dụ (PowerShell):
```
# Tạo thư mục public nếu chưa có
mkdir public
# Sao chép ảnh
Copy-Item ..\*.png .\public -ErrorAction SilentlyContinue
Copy-Item ..\*.jpg .\public -ErrorAction SilentlyContinue
Copy-Item ..\*.webp .\public -ErrorAction SilentlyContinue
```

## Chạy dự án
```
npm install
npm run dev
```

## Build
```
npm run build
```

## Next Steps Gợi Ý
- Bổ sung toàn bộ danh sách members
- Hoàn thiện logic rotator nâng cao (caching + visibility pause)
- Thêm tối ưu nén ảnh client (canvas) nếu thật sự cần
- Viết test đơn giản cho hook `usePaneRotator`
