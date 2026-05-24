# quan-demo 独立站设计文档

**日期**: 2026-05-24  
**状态**: 已确认  
**范围**: 访客浏览 + 访客下单，无管理后台，无会员系统，支付占位

---

## 概述

类优衣库风格的服装独立站 demo。黑白极简视觉，访客可浏览商品、选择颜色/尺码、加入购物车、填写收货信息提交订单。不接入真实支付，订单写入 CF KV。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Astro（静态输出） |
| 部署 | Cloudflare Pages（CF 面板手动管理，GitHub 集成，不使用 Wrangler） |
| API | CF Pages Functions |
| 存储 | CF KV（单一命名空间 `QUAN_STORE`） |
| 商品数据 | 静态 JSON 文件（`src/data/products.json`） |

---

## 商品品类

tshirt（T恤）、hoodie（卫衣）、shorts（短裤）、pants（长裤）、shirt（衬衣）、polo（Polo衫）

---

## 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | Hero 大图 + 六宫格分类入口 + 推荐商品 |
| `/products/[category]` | 商品列表 | 按品类展示，支持颜色筛选，2列网格 |
| `/product/[id]` | 商品详情 | 左图右信息，颜色/尺码选择，加入购物车 |
| `/cart` | 购物车 | 商品列表、数量调整、合计，进入下单 |
| `/checkout` | 下单页 | 填写姓名/手机/地址，支付方式占位，提交 |
| `/order/[id]` | 订单确认页 | 展示订单号、商品摘要、收货信息 |

---

## API（CF Pages Functions）

### `POST /api/order`

接收购物车 + 收货信息，生成订单写入 KV，返回订单 ID。

**请求体**
```json
{
  "contact": { "name": "string", "phone": "string", "address": "string" },
  "items": [
    { "productId": "string", "color": "string", "size": "string", "quantity": 1, "price": 99 }
  ]
}
```

**响应**
```json
{ "orderId": "ORD-1748000000000", "total": 99 }
```

### `GET /api/order/[id]`

读取单个订单详情，供确认页展示。

---

## CF KV 数据结构

**命名空间**: `QUAN_STORE`（在 CF 面板创建，绑定到 Pages 项目）

| Key 格式 | Value 结构 | 用途 |
|----------|-----------|------|
| `order:{orderId}` | `{ contact, items, total, status, createdAt }` | 订单记录 |
| `product:status:{productId}` | `{ available: boolean }` | 商品上下架状态 |

订单 ID 格式：`ORD-{timestamp}`，保证唯一性足够 demo 使用。

---

## 静态商品数据

`src/data/products.json` 结构示例：

```json
[
  {
    "id": "tshirt-001",
    "name": "圆领短袖T恤",
    "category": "tshirt",
    "price": 99,
    "colors": [
      { "name": "白色", "hex": "#FFFFFF" },
      { "name": "黑色", "hex": "#000000" },
      { "name": "蓝色", "hex": "#3B82F6" }
    ],
    "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
    "images": { "white": "/images/tshirt-001-white.jpg", "black": "/images/tshirt-001-black.jpg" }
  }
]
```

商品图片放 `public/images/`，建议每个颜色对应一张图（demo 阶段可用占位图）。

---

## 视觉规范

- **色调**: 黑白为主，极少使用强调色
- **导航**: 黑底白字，品牌名左对齐，品类导航居中，购物车图标右对齐
- **商品卡**: 图片 3:4 比例，图片下方显示名称 + 价格 + 颜色圆点
- **字体**: 无衬线字体，品牌名全大写加字间距
- **按钮**: 主操作黑底白字，次操作白底黑边

---

## 购物车状态管理

购物车存储在浏览器 `localStorage`，无需后端，结构：

```json
[
  { "productId": "tshirt-001", "color": "白色", "size": "M", "quantity": 1, "price": 99 }
]
```

---

## CF Pages 部署配置

在 CF 面板手动设置（不使用 Wrangler）：

1. **连接 GitHub 仓库** `quan-demo`，分支 `main`
2. **构建命令**: `npm run build`，输出目录: `dist`
3. **KV 绑定**: 在 Pages 项目 → Settings → Functions → KV namespace bindings，绑定变量名 `QUAN_STORE`
4. **环境变量**: 暂无

---

## 超出当前范围（后续再做）

- 管理后台（商品上下架、订单管理）
- 会员注册 / 登录
- 真实支付接入
- 库存数量管理
- 搜索功能
