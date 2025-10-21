# AssetFlow Database Schema

## Database Name
`assetflow` (will be created automatically when first collection is inserted)

## Collections and Schemas

### 1. Users Collection
```javascript
{
  _id: ObjectId,
  name: String (required, trimmed),
  email: String (required, unique, trimmed, lowercase),
  password: String (required, minlength: 6, hashed),
  role: String (enum: ['admin', 'chief-administrative-officer', 'department-officer', 'user'], default: 'user'),
  department: ObjectId (ref: 'departments', required for department-officer),
  employeeId: String (sparse index),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- email: unique
- employeeId: sparse

### 2. Departments Collection
```javascript
{
  _id: ObjectId,
  name: String (required, trimmed, unique),
  type: String (required, enum: ['Major', 'Academic', 'Service']),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- name: unique
- type: 1

### 3. Assets Collection
```javascript
{
  _id: ObjectId,
  itemName: String (required, trimmed),
  category: String (required),
  type: String (required, enum: ['capital', 'revenue']),
  quantity: Number (required, min: 1),
  pricePerItem: Number (required, min: 0),
  totalAmount: Number (required, calculated as quantity * pricePerItem),
  vendorName: String (required),
  vendorAddress: String (required),
  contactNumber: String (required),
  email: String (required, lowercase),
  billNo: String (required),
  billDate: Date (required),
  billFileId: ObjectId (ref: GridFS files),
  department: ObjectId (required, ref: 'departments'),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- department: 1
- type: 1
- category: 1

### 4. Vendors Collection (Optional - embedded in assets)
```javascript
{
  _id: ObjectId,
  name: String (required, trimmed),
  address: String (required, trimmed),
  contactNumber: String (required, trimmed),
  email: String (required, trimmed, lowercase),
  createdAt: Date,
  updatedAt: Date
}
```

## GridFS Collections (for file storage)
- fs.files
- fs.chunks

## Sample Data for Manual Creation

### Departments (17 records)
```javascript
// Major Departments
{ name: 'Department of Civil Engineering', type: 'Major' }
{ name: 'Department of Computer Science and Engineering (CSE)', type: 'Major' }
{ name: 'Department of Electronics and Communication Engineering (ECE)', type: 'Major' }
{ name: 'Department of Electrical and Electronics Engineering (EEE)', type: 'Major' }
{ name: 'Department of Information Science and Engineering (ISE)', type: 'Major' }
{ name: 'Department of Mechanical Engineering', type: 'Major' }
{ name: 'Department of Artificial Intelligence and Machine Learning (AIML, under CSE)', type: 'Major' }

// Academic Departments
{ name: 'Department of First Year Engineering', type: 'Academic' }
{ name: 'Department of Chemistry', type: 'Academic' }
{ name: 'Department of Physics', type: 'Academic' }
{ name: 'Department of Mathematics', type: 'Academic' }

// Service Departments
{ name: 'Department of Electrical Maintenance', type: 'Service' }
{ name: 'Department of Civil Maintenance', type: 'Service' }
{ name: 'Office Administration', type: 'Service' }
{ name: 'Central Library', type: 'Service' }
{ name: 'Department of Sports and Physical Education', type: 'Service' }
{ name: 'Boys\' Hostel Administration', type: 'Service' }
{ name: 'Girls\' Hostel Administration', type: 'Service' }
```

### Users (4 records)
```javascript
{
  name: 'Admin User',
  email: 'admin@gmail.com',
  password: '$2a$12$...' // bcrypt hash of 'admin123'
  role: 'admin'
}
{
  name: 'Chief Administrative Officer',
  email: 'cao@gmail.com',
  password: '$2a$12$...' // bcrypt hash of 'cao123'
  role: 'chief-administrative-officer'
}
{
  name: 'Department Officer',
  email: 'officer@gmail.com',
  password: '$2a$12$...' // bcrypt hash of 'officer123'
  role: 'department-officer',
  department: ObjectId('...') // Reference to first department
}
{
  name: 'Regular User',
  email: 'user@gmail.com',
  password: '$2a$12$...' // bcrypt hash of 'user123'
  role: 'user'
}
```

### Assets (34 records - 17 capital + 17 revenue)
Each asset includes vendor info, bill details, and references to departments.

## MongoDB Connection String
```
mongodb+srv://ModelGenie:Raghu123@cluster0.dxmpr5a.mongodb.net/assetflow?retryWrites=true&w=majority&appName=Cluster0
```

## Manual Creation Commands (mongosh)

```javascript
// Connect to MongoDB Atlas
mongosh "mongodb+srv://ModelGenie:Raghu123@cluster0.dxmpr5a.mongodb.net/assetflow?retryWrites=true&w=majority&appName=Cluster0"

// Switch to database (created automatically)
use assetflow

// Create collections with validation (optional - Mongoose handles this)
db.createCollection("users")
db.createCollection("departments")
db.createCollection("assets")
db.createCollection("vendors")

// Insert sample data
// Copy and paste the sample data above
