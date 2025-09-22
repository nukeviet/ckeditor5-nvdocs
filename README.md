# Plugin NVDocs cho Ckeditor 5

Công cụ xem tài liệu trực tuyến cho NukeViet

# Cài đặt

Yêu cầu:

- Node.js 18.0.0+
- npm 5.7.1+

```
npm install
```

Để cài lại sau khi build

```
rm -rf node_modules
rm -f package-lock.json
find ./src -name "*.js" -type f | xargs /bin/rm -f
find ./src -name "*.js.map" -type f | xargs /bin/rm -f
find ./src -name "*.d.ts" -type f | xargs /bin/rm -f
npm install
```

# Build

Đây là dạng module, không chạy độc lập được nên build chỉ dịch js từ TypeScript ra xem thử có lỗi hay không.  
Để build và chạy thử nghiệm xem hướng dẫn tại đây https://github.com/nukeviet/nukeviet45-ckeditor5-classic

**Build để kiểm tra dịch lỗi hay thành công**

```
npm run build
```

# Giấy phép

GPL-2.0 hoặc mới hơn. Xem thêm tại file LICENSE.
