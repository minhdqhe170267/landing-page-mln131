# Đa Dạng Tôn Giáo Việt Nam

Landing page multi-page về đa dạng tôn giáo Việt Nam - phân tích quan điểm lý luận về tôn giáo trong thời kỳ quá độ lên chủ nghĩa xã hội, thực trạng và chính sách tôn giáo của Đảng, Nhà nước Việt Nam. Liên hệ yêu cầu đối với sinh viên Đại học FPT trong việc tôn trọng sự đa dạng tôn giáo, xây dựng môi trường học tập và làm việc đa văn hóa, hài hòa.

🌐 **Live Demo:** https://landing-page-mln131.vercel.app/

## 📋 Mục Lục

- [Tính Năng](#-tính-năng)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
- [Chạy Dự Án Locally](#-chạy-dự-án-locally)
- [Hướng Dẫn Deploy](#-hướng-dẫn-deploy)
- [Kiểm Thử](#-kiểm-thử)
- [Đóng Góp](#-đóng-góp)
- [Giấy Phép](#-giấy-phép)

## ✨ Tính Năng

### Các Trang Chính
- **Trang Chủ (index.html)** - Giới thiệu tổng quan với hero section, thống kê và CTA
- **Lịch Sử Chính Sách (timeline.html)** - Timeline tương tác về lịch sử chính sách tôn giáo Việt Nam
- **Các Tôn Giáo (mosaic.html)** - Lưới mosaic hiển thị 8 tôn giáo chính tại Việt Nam
- **Sinh Viên FPT (fpt-students.html)** - Hướng dẫn và cam kết cho sinh viên FPT
- **Giới Thiệu (about.html)** - Thông tin về dự án và tài liệu tham khảo

### Tính Năng Nổi Bật
- 🎨 **Thiết kế Responsive** - Tương thích mọi thiết bị (mobile, tablet, desktop)
- ♿ **Accessibility WCAG 2.1 AA** - Hỗ trợ người dùng khuyết tật
- 🚀 **Performance tối ưu** - Lighthouse score > 90
- 🎬 **Animations mượt mà** - Scroll-triggered animations với Intersection Observer
- 📱 **Mobile-first approach** - Thiết kế ưu tiên mobile
- 🔍 **SEO tối ưu** - Meta tags, Open Graph, structured data

### Components Tương Tác
- **Navigation System** - Sticky navbar với hamburger menu responsive
- **Timeline Component** - Vertical zigzag layout với modal chi tiết
- **Mosaic Grid** - CSS Grid với hover effects
- **Accordion Component** - Expandable/collapsible sections
- **Carousel Component** - Testimonials slider với navigation
- **Counter Animation** - Animated statistics numbers
- **Modal Component** - Popup với focus trap và keyboard support

## 📁 Cấu Trúc Dự Án

```
vietnam-religious-diversity/
├── index.html              # Trang chủ
├── timeline.html           # Trang lịch sử chính sách
├── mosaic.html             # Trang các tôn giáo
├── fpt-students.html       # Trang sinh viên FPT
├── about.html              # Trang giới thiệu
├── css/
│   ├── main.css            # Base styles, typography, colors
│   ├── animations.css      # Keyframes, transitions
│   ├── timeline.css        # Timeline-specific styles
│   ├── mosaic.css          # Mosaic grid styles
│   └── responsive.css      # Media queries
├── js/
│   ├── main.js             # Navigation, utilities, accordion, carousel
│   ├── scroll-effects.js   # Intersection Observer animations
│   ├── timeline.js         # Timeline interactions, modals
│   └── mosaic.js           # Mosaic hover effects
├── assets/
│   ├── images/             # Hình ảnh
│   ├── icons/              # Icons SVG
│   └── data.json           # Dữ liệu động
├── components/
│   └── navigation.html     # Navigation component template
├── tests/
│   └── property/           # Property-based tests
├── vercel.json             # Vercel deployment config
├── robots.txt              # SEO robots file
├── sitemap.xml             # Sitemap cho SEO
├── package.json            # Dependencies
└── README.md               # Tài liệu này
```

## 🛠 Công Nghệ Sử Dụng

| Công nghệ | Mô tả |
|-----------|-------|
| **HTML5** | Semantic markup, accessibility attributes |
| **CSS3** | Flexbox, Grid, Custom Properties, Animations |
| **JavaScript (ES6+)** | Vanilla JS, Intersection Observer API |
| **Jest** | Unit testing framework |
| **fast-check** | Property-based testing |
| **Vercel** | Hosting và deployment |

## 📦 Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống
- Node.js >= 14.x
- npm >= 6.x (hoặc yarn)
- Git

### Bước 1: Clone Repository

```bash
git clone https://github.com/your-username/vietnam-religious-diversity.git
cd vietnam-religious-diversity
```

### Bước 2: Cài Đặt Dependencies

```bash
npm install
```

## 🚀 Chạy Dự Án Locally

### Cách 1: Sử dụng Live Server (VS Code)

1. Cài đặt extension **Live Server** trong VS Code
2. Click chuột phải vào `index.html`
3. Chọn **"Open with Live Server"**
4. Trình duyệt sẽ tự động mở tại `http://localhost:5500`

### Cách 2: Sử dụng Python HTTP Server

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Truy cập: `http://localhost:8000`

### Cách 3: Sử dụng Node.js HTTP Server

```bash
# Cài đặt http-server globally
npm install -g http-server

# Chạy server
http-server -p 8000
```

Truy cập: `http://localhost:8000`

### Cách 4: Sử dụng npx (không cần cài đặt)

```bash
npx serve
```

## ☁️ Hướng Dẫn Deploy

### Deploy lên Vercel

#### Cách 1: Deploy qua Vercel CLI

1. **Cài đặt Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Đăng nhập Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Deploy production:**
   ```bash
   vercel --prod
   ```

#### Cách 2: Deploy qua Vercel Dashboard

1. Truy cập [vercel.com](https://vercel.com)
2. Đăng nhập với GitHub/GitLab/Bitbucket
3. Click **"New Project"**
4. Import repository từ Git
5. Vercel sẽ tự động detect và deploy

#### Cách 3: Deploy qua Git Integration

1. Push code lên GitHub/GitLab/Bitbucket
2. Kết nối repository với Vercel
3. Mỗi lần push sẽ tự động trigger deployment

### Cấu Hình Vercel

File `vercel.json` đã được cấu hình sẵn:

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**Tính năng:**
- **Clean URLs** - Truy cập `/timeline` thay vì `/timeline.html`
- **Caching** - Static assets được cache 1 năm
- **No trailing slash** - URLs không có dấu `/` cuối

## 🔧 Production Optimization

### CSS và JavaScript Minification

Dự án sử dụng **clean-css-cli** và **terser** để minify CSS và JavaScript cho production.

#### Build Commands

```bash
# Build tất cả CSS và JS (minified)
npm run build

# Build chỉ CSS
npm run build:css

# Build chỉ JavaScript
npm run build:js
```

#### Output Structure

Sau khi build, các file minified sẽ được tạo trong thư mục `dist/`:

```
dist/
├── css/
│   ├── main.min.css
│   ├── animations.min.css
│   ├── timeline.min.css
│   ├── mosaic.min.css
│   └── responsive.min.css
└── js/
    ├── main.min.js
    ├── scroll-effects.min.js
    ├── timeline.min.js
    └── mosaic.min.js
```

#### Sử Dụng File Minified

Để sử dụng file minified trong production, thay đổi các link trong HTML:

```html
<!-- Development -->
<link rel="stylesheet" href="css/main.css">
<script src="js/main.js"></script>

<!-- Production -->
<link rel="stylesheet" href="dist/css/main.min.css">
<script src="dist/js/main.min.js"></script>
```

#### Vercel Auto-Optimization

Khi deploy lên Vercel, các tối ưu hóa sau được tự động áp dụng:
- **Gzip/Brotli compression** - Nén file tự động
- **CDN caching** - Cache static assets trên edge network
- **HTTP/2** - Multiplexing requests

#### Manual Optimization Checklist

- [x] CSS minification với clean-css-cli
- [x] JavaScript minification với terser
- [x] Lazy loading images (loading="lazy")
- [x] Prefers-reduced-motion support
- [x] Efficient CSS selectors
- [x] No unused CSS (reviewed)
- [x] No unused JavaScript (reviewed)

### Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| First Contentful Paint | < 1.5s | ✅ |
| Largest Contentful Paint | < 2.5s | ✅ |
| Lighthouse Performance | > 90 | ✅ |
| CSS Size (minified) | < 50KB | ✅ |
| JS Size (minified) | < 30KB | ✅ |

## 🧪 Kiểm Thử

### Chạy Tất Cả Tests

```bash
npm test
```

### Chạy Tests với Watch Mode

```bash
npm run test:watch
```

### Chạy Tests với Coverage

```bash
npm run test:coverage
```

### Property-Based Tests

Dự án sử dụng **fast-check** cho property-based testing:

```bash
# Chạy property tests
npm test -- --testPathPattern=property
```

### Các Test Categories

| Category | Mô tả |
|----------|-------|
| **Unit Tests** | Test các functions và components riêng lẻ |
| **Property Tests** | Test các properties phải đúng với mọi input |
| **Accessibility Tests** | Test WCAG 2.1 AA compliance |

## 🤝 Đóng Góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

### Coding Standards

- Sử dụng semantic HTML
- CSS theo BEM naming convention
- JavaScript ES6+ syntax
- Comment code bằng tiếng Việt hoặc tiếng Anh
- Đảm bảo accessibility cho mọi tính năng mới

## 📄 Giấy Phép

Dự án này được phát triển cho mục đích giáo dục tại Đại học FPT.

---

**Đa Dạng - Tôn Trọng - Hòa Hợp** 🇻🇳
