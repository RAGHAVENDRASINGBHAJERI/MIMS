# AssetFlow Stream

A comprehensive asset management system for tracking capital and revenue assets with advanced reporting capabilities.

## Features

- **Asset Management**: Track capital and revenue assets with detailed information
- **Multi-item Bills**: Support for bills with multiple items
- **Role-based Access**: Admin, Chief Administrative Officer, and Department Officer roles
- **Advanced Reporting**: Department, vendor, item, and year-based reports
- **Export Capabilities**: Excel, Word, and PDF exports
- **Bill Management**: Upload, preview, and download bill files
- **Merged Reports**: Combined PDF reports with asset details

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- GridFS for file storage
- JWT authentication
- ExcelJS for Excel exports
- PDFKit for PDF generation
- Archiver for ZIP files

### Frontend
- React with TypeScript
- Vite build tool
- Tailwind CSS
- Shadcn/ui components
- React Hook Form
- Axios for API calls

## Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp config.env.template config.env
```

4. Configure environment variables in `config.env`:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/assetflow
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
```

5. Seed the database (optional):
```bash
node seedDepartments.js
node seedUsers.js
```

6. Start the server:
```bash
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.template .env
```

4. Configure environment variables in `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

5. Build for production:
```bash
npm run build
```

6. Start the development server (for development):
```bash
npm run dev
```

## Deployment

### Production Build

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. The built files will be in `frontend/dist/`

3. Configure your web server (nginx, Apache) to serve the static files and proxy API requests to the backend.

### Environment Variables

Ensure all environment variables are properly set for production:

**Backend (`config.env`):**
- `NODE_ENV=production`
- `MONGODB_URI` - Your production MongoDB connection string
- `JWT_SECRET` - Strong secret key for JWT tokens
- `PORT` - Server port (default: 5000)

**Frontend (`.env`):**
- `VITE_API_URL` - Your production API URL

### Database Setup

1. Create MongoDB database
2. Run seed scripts to populate initial data:
   - `node seedDepartments.js` - Creates default departments
   - `node seedUsers.js` - Creates admin user

### Default Admin User

After running the seed script, you can login with:
- **Email**: admin@example.com
- **Password**: admin123

**Important**: Change the default admin password after first login.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Assets
- `GET /api/assets` - Get all assets
- `POST /api/assets` - Create new asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset
- `GET /api/assets/:id/bill` - Download bill file

### Reports
- `GET /api/reports/department` - Department report
- `GET /api/reports/vendor` - Vendor report
- `GET /api/reports/item` - Item report
- `GET /api/reports/year` - Year report
- `GET /api/reports/combined` - Combined report
- `GET /api/reports/export/excel` - Excel export
- `GET /api/reports/export/word` - Word export
- `GET /api/reports/export/bills-zip` - ZIP export of bills
- `GET /api/reports/export/merged-pdf` - Merged PDF export

### Departments
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

## User Roles

1. **Admin**: Full system access
2. **Chief Administrative Officer**: View all departments and reports
3. **Department Officer**: Access only to assigned department data

## File Structure

```
assetflow-stream/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── config.env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── .env
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.