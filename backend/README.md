# AssetFlow Backend API

College Asset & Revenue Tracking System Backend

## Features

- **Asset Management**: Track college assets with bills stored in GridFS
- **Department Management**: Organize assets by departments
- **Reporting**: Generate various reports (department, vendor, item, year-wise)
- **File Storage**: Store bill files in MongoDB GridFS
- **Export**: Export reports to Excel and Word formats

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- GridFS for file storage
- Multer for file uploads
- ExcelJS for Excel exports
- Docx for Word exports

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `config.env`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/assetflow
CORS_ORIGIN=http://localhost:5173
GRIDFS_BUCKET=bills
```

3. Start MongoDB service

4. Seed departments:
```bash
npm run seed
```

5. Start development server:
```bash
npm run dev
```

## API Endpoints

### Health Check
- `GET /health` - API health status

### Departments
- `GET /api/departments` - List all departments

### Assets
- `POST /api/assets` - Create asset (multipart/form-data)
- `GET /api/assets` - List all assets
- `GET /api/assets/:id` - Get single asset
- `GET /api/assets/:id/bill` - Download bill file

### Reports
- `GET /api/reports/department` - Department-wise report
- `GET /api/reports/vendor` - Vendor-wise report
- `GET /api/reports/item` - Item-wise report
- `GET /api/reports/year` - Year-wise report
- `GET /api/reports/export/excel?type=department` - Export Excel
- `GET /api/reports/export/word?type=department` - Export Word

## Scripts

- `npm run dev` - Start development server
- `npm start` - Start production server
- `npm run seed` - Seed departments
