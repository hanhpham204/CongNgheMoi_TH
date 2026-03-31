# Hotel Room Management (Midterm)

Project Node.js + Express + EJS + DynamoDB + S3 theo de thi giua ky.

## 1) Cai dat

```bash
npm install
```

Copy `.env.example` thanh `.env`, sau do dien thong tin AWS.

## 2) Tao bang DynamoDB

Ten bang: `HotelRooms`

- Partition key: `roomId` (String)

Thuoc tinh goi y:

- `roomId` (String): ma phong duy nhat
- `roomName` (String): ten phong
- `roomType` (String): Standard/Deluxe/Suite
- `pricePerNight` (Number): gia theo dem
- `capacity` (Number): suc chua
- `status` (String): Available/Occupied/Maintenance
- `imageUrl` (String): link anh tren S3
- `createdAt` (String): thoi gian tao ISO

## 3) Chay ung dung

```bash
npm run dev
```

Truy cap: `http://localhost:3000/rooms`

## 4) API

### GET /rooms

- Hien thi danh sach phong
- Tim theo `q` (roomName)
- Loc theo `roomType`, `status`

Vi du:

`/rooms?q=Deluxe&roomType=Deluxe&status=Available`

### POST /rooms/api

Them phong (multipart/form-data):

- `roomName` (required, non-empty)
- `roomType` in `{Standard, Deluxe, Suite}`
- `pricePerNight` > 0
- `capacity` from 1..10
- `status` in `{Available, Occupied, Maintenance}`
- `image` (optional file upload S3)

### PUT /rooms/api/:roomId

Cap nhat:

- `pricePerNight`
- `capacity`
- `status`
- `image`

### DELETE /rooms/api/:roomId

- Xoa 1 phong theo `roomId`

## 5) Logic tinh toan

- Doanh thu gia dinh 3 dem: `pricePerNight * 3`
- Dem so phong `Available` theo tung `roomType`
