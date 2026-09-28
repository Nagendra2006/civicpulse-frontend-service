# CivicPulse Frontend - Backend Microservices API Changes

## 🔄 Overview of Changes

Your backend has moved from a **monolithic architecture** to **microservices** with significant structural changes. This document outlines all API and field changes needed in the frontend.

---

## 📊 Key Architectural Changes

### Database Structure Changes

#### Old Monolithic Structure
```
Complaints Table:
- id, title, description, category (string), priority (string), status (string)
- userId, officerId, deadline, imageUrl, resolutionImageUrl
```

#### New Microservices Structure
```
Grievances Table (GrievanceService):
- id, title, description, address (NEW)
- userId, mandalId (foreign key)
- categoryId (foreign key to Category table)
- priority (ENUM: LOW, MEDIUM, HIGH, CRITICAL)
- status (ENUM: PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED, REOPENED)
- createdAt (timestamp)

GrievanceMedia Table (NEW):
- id, fileUrl, type (ENUM: BEFORE, AFTER, DOCUMENT)
- grievanceId (foreign key)
- uploadedAt (timestamp)

Category Table (NEW - Hierarchical):
- id, name, parent_id (for subcategories)
- department_id (links to Department)

Department Table (NEW):
- id, name

State Table (NEW):
- id, name

District Table (NEW):
- id, name, state_id

Mandal Table (NEW):
- id, name, district_id

Assignment Table (NEW):
- id, grievanceId, officerId
- priority (ENUM)

GrievanceHistory Table (NEW):
- id, grievanceId, status (ENUM)
- updatedBy (officer/admin id), remarks, updatedAt
```

---

## 🔑 API Endpoint Changes

### Authentication API (AuthService)

#### Login
**Old:**
```bash
POST /api/auth/login
Body: { username, password }
Response: { token, user_id, username, role }
```

**New:**
```bash
POST /api/auth/login
Body: { email, password }
Response: {
  token,
  "message": "Login successful"
}
```

**Frontend Changes:**
- Change `username` → `email` in login form
- Parse response structure correctly
- Extract user info from JWT token (will need JWT decode library)

---

#### Register
**Old:**
```bash
POST /api/auth/register?role=CITIZEN
Body: { username, email, password, phone }
Response: { token, success }
```

**New:**
```bash
POST /api/auth/register
Body: {
  name,
  email,
  password,
  phone
}
Response: {
  token,
  "message": "User registered successfully"
}
Note: OTP verification is required before registration
```

**Frontend Changes:**
- Implement OTP-based registration flow
- Send OTP first → Verify OTP → Then register
- Remove role selection from register (always CITIZEN)

---

#### Create Officer (Admin Only)
**Old:**
```bash
POST /api/officers
Body: { name, email, phone, password }
Response: { id, name, email }
```

**New:**
```bash
POST /api/auth/create-officer
Headers: Authorization: Bearer <admin_token>
Body: {
  name,
  email,
  password,
  phone,
  departmentId (REQUIRED - Long),
  mandalId (REQUIRED - Long),
  districtId (REQUIRED - Long)
}
Response: "Officer created successfully"
```

**Frontend Changes:**
- Add dropdowns for Department, Mandal, District
- Response is now a string message (not object)
- Validate IDs are provided

---

#### Get Officers
**Old:**
```bash
GET /api/officers
Response: [{ id, name, email, phone }]
```

**New:**
```bash
GET /api/auth/officers?mandalId=1
Headers: Authorization: Bearer <token>
Response: [
  {
    id,
    name,
    email,
    phone,
    departmentId,
    mandalId
  }
]

OR filter by mandal and department:
GET /api/auth/officers/filter?mandalId=1&departmentId=2
```

**Frontend Changes:**
- Must pass `mandalId` as query parameter
- Can filter by both `mandalId` and `departmentId`

---

### Grievance API (GrievanceService)

#### Create Grievance
**Old:**
```bash
POST /api/grievances
Content-Type: multipart/form-data
Body: { title, description, category, priority, image }
Response: { id, title, status, imageUrl }
```

**New:**
```bash
POST /api/grievances/create
Content-Type: multipart/form-data
Body:
  - data: { "title", "description", "address", "categoryId", "mandalId" } (JSON)
  - file: <image file> (optional)

Response: {
  id,
  title,
  description,
  address,
  status,
  priority,
  userId,
  mandalId,
  category: { id, name },
  createdAt
}
```

**Frontend Changes:**
- Add `address` field (required)
- Use `categoryId` instead of category name (must fetch categories first)
- Use `mandalId` instead of district/mandal strings (must fetch mandals)
- Send data as JSON in `data` part, file in `file` part
- Remove priority from creation (set by admin/officer)
- Response includes category object now

---

#### Get My Grievances
**Old:**
```bash
GET /api/grievances/me
Response: [{ id, title, status, category, imageUrl }]
```

**New:**
```bash
GET /api/grievances/me
Response: [
  {
    id,
    title,
    description,
    address,
    status (ENUM: PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, etc),
    priority,
    userId,
    mandalId,
    category: { id, name, parent: { id, name } },
    createdAt,
    media: [{ id, fileUrl, type: "BEFORE"|"AFTER", uploadedAt }]
  }
]
```

**Frontend Changes:**
- Status is now ENUM (PENDING, ASSIGNED, IN_PROGRESS, RESOLVED)
- Address field added
- Category is now an object with hierarchy
- Media is array of GrievanceMedia objects (with type field)
- No imageUrl - use media[0].fileUrl instead

---

#### Get All Grievances (Admin/Officer)
**Old:**
```bash
GET /api/complaints
Response: [{ id, title, status, officerId, deadline }]
```

**New:**
```bash
GET /api/grievances?page=0&size=10&status=PENDING&categoryId=1&mandalId=1&fromDate=2024-01-01&toDate=2024-12-31
Response: {
  "content": [
    {
      id,
      title,
      description,
      address,
      status,
      priority,
      userId,
      mandalId,
      category: { id, name },
      createdAt
    }
  ],
  "totalElements": 50,
  "totalPages": 5,
  "currentPage": 0
}
```

**Frontend Changes:**
- Response is now paginated (Page object)
- Query parameters: `page`, `size`, `status`, `categoryId`, `mandalId`, `fromDate`, `toDate`
- No officerId in response (assignment is separate)
- DateTime filters available

---

#### Get Grievance by ID
**Old:**
```bash
GET /api/complaints/{id}
Response: { id, title, status, imageUrl, resolutionImageUrl }
```

**New:**
```bash
GET /api/grievances/{id}
Response: {
  id,
  title,
  description,
  address,
  status,
  priority,
  userId,
  mandalId,
  category: { id, name },
  createdAt,
  media: [
    { id, fileUrl, type: "BEFORE", uploadedAt },
    { id, fileUrl, type: "AFTER", uploadedAt }
  ],
  assignment: { id, officerId, priority },
  history: [
    { id, status, updatedBy, remarks, updatedAt }
  ]
}
```

**Frontend Changes:**
- Media is array with type (BEFORE, AFTER, DOCUMENT)
- Assignment details included
- History track of all status changes
- No separate resolutionImageUrl - use media with type="AFTER"

---

#### Assign Grievance (Admin)
**Old:**
```bash
PUT /api/complaints/{id}/assign
Body: { officer_id, priority, deadline }
Response: { success: true }
```

**New:**
```bash
POST /api/assignments
Body: {
  grievanceId,
  officerId,
  priority (ENUM: LOW, MEDIUM, HIGH, CRITICAL)
}
Response: { id, grievanceId, officerId, priority }
```

**Frontend Changes:**
- Endpoint changed from PUT to POST
- Remove deadline field
- Priority is ENUM (not string)
- New response format

---

#### Update Grievance Status
**Old:**
```bash
PUT /api/complaints/{id}/update
Body: { status, resolutionNote, resolutionImage }
Response: { status }
```

**New:**
```bash
POST /api/grievances/{id}/status
Body: {
  status (ENUM: ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED),
  remarks
}
Response: { id, status, updatedAt }
```

**Frontend Changes:**
- Use POST instead of PUT
- Use `remarks` instead of `resolutionNote`
- Separate endpoint for media upload (see below)
- Status values are specific ENUMs

---

#### Upload Media (Officer)
**Old:**
```bash
PUT /api/grievances/{id}/image
Content-Type: multipart/form-data
Body: { image }
Response: { imageUrl }
```

**New:**
```bash
POST /api/grievances/{id}/media
Content-Type: multipart/form-data
Body:
  - file: <image>
  - type: "BEFORE"|"AFTER"|"DOCUMENT"

Response: {
  id,
  fileUrl,
  type,
  uploadedAt
}
```

**Frontend Changes:**
- Endpoint changed
- Must specify media type
- Can upload multiple media items
- Returns full media object with type

---

## 🎯 Status & Priority Enum Values

### Grievance Status (ENUM)
```java
PENDING       - Initial state when created
ASSIGNED      - Assigned to an officer
IN_PROGRESS   - Officer is working on it
RESOLVED      - Issue resolved
REJECTED      - Grievance rejected
REOPENED      - Citizen reopened after resolved
```

### Priority (ENUM)
```java
LOW           - Can wait
MEDIUM        - Normal processing
HIGH          - Should be done soon
CRITICAL      - Immediate action needed
```

### Media Type (ENUM)
```java
BEFORE        - Initial complaint image
AFTER         - Resolution confirmation image
DOCUMENT      - Supporting document/evidence
```

---

## 🔗 New Required Data Structures

### Master Data (Admin Setup Required)

#### Categories (Hierarchical)
```
Parent Categories:
- Roads & Infrastructure
- Water Supply
- Electricity
- Sanitation
- Health Services
- Education

Sub-categories under each with departments
```

#### Districts
```
Each state has multiple districts
Each district has admin user
```

#### Mandals
```
Each district has multiple mandals
Grievances linked to mandals
```

#### Departments
```
Officers assigned to departments
Categories linked to departments
```

---

## 📝 Frontend API Client Changes

### Update `src/utils/api.js`

**Key Changes:**

1. **Base URL stays same** (Gateway routes to microservices)
   ```javascript
   const API_BASE = 'http://localhost:8080'
   ```

2. **Login/Register flow**
   ```javascript
   // Old
   api.login({ username, password })
   
   // New
   api.login({ email, password })
   ```

3. **Grievance creation**
   ```javascript
   // Old
   api.submitGrievance(formData) // FormData with fields
   
   // New
   const fd = new FormData()
   fd.append('data', JSON.stringify({ 
     title, description, address, categoryId, mandalId 
   }))
   fd.append('file', imageFile)
   api.createGrievance(fd)
   ```

4. **Status updates**
   ```javascript
   // Old
   api.updateComplaintResolution(id, { status, resolutionNote, imageFile })
   
   // New
   api.updateGrievanceStatus(id, { status, remarks })
   api.uploadMedia(id, { file, type: 'AFTER' })
   ```

5. **Grievance queries**
   ```javascript
   // Old
   api.getMyGrievances()
   api.getAllComplaints()
   
   // New
   api.getMyGrievances({ status, page, size })
   api.getAllGrievances({ status, categoryId, mandalId, page, size })
   ```

---

## 🎨 Frontend Component Changes

### Login Component
- Change input `username` → `email`
- Implement OTP verification before registration

### Create Grievance Form
- Add `address` field (required)
- Fetch categories from backend (hierarchical dropdown)
- Fetch mandals from backend (based on district)
- Remove priority field (set by admin)
- Use FormData with separate data/file parts

### Grievance List
- Use pagination (page, size)
- Filter by category ID (not name)
- Use new status ENUM values
- Display media array properly

### Admin Dashboard
- Fetch officers with mandalId filter
- Create officers with departmentId, mandalId, districtId
- Assign grievances with new endpoint
- Use new status values in filters

### Officer Dashboard
- Fetch assigned grievances (new endpoint needed)
- Mark as IN_PROGRESS
- Upload media with type="AFTER"
- Update status to RESOLVED

---

## ⚠️ Critical Implementation Points

1. **JWT Token Parsing**
   - You'll need to decode JWT to get user details
   - Install: `npm install jwt-decode`
   - Extract userId, roles from token

2. **Hierarchical Categories**
   - Categories are nested (parent-child)
   - Must fetch and show as nested dropdowns

3. **Master Data Fetch**
   - Fetch categories on app load
   - Fetch districts/mandals on demand
   - Fetch departments for officer creation

4. **Pagination**
   - All list endpoints now return paginated responses
   - Implement page navigation

5. **Media Management**
   - Multiple media items per grievance
   - Each has type (BEFORE, AFTER, DOCUMENT)
   - Upload separately from status updates

6. **Status Flow**
   - Citizen creates: PENDING
   - Admin assigns: ASSIGNED
   - Officer marks: IN_PROGRESS
   - Officer uploads & marks: RESOLVED
   - Citizen can: REOPEN

---

## 🚀 Implementation Roadmap

### Phase 1: Authentication
- [ ] Update Login component
- [ ] Implement OTP verification
- [ ] Update Register component
- [ ] JWT token parsing

### Phase 2: Data Structures
- [ ] Update API client for new endpoints
- [ ] Add categories fetching
- [ ] Add mandals/districts fetching
- [ ] Add departments fetching

### Phase 3: Citizen Features
- [ ] Update Create Grievance form
- [ ] Update My Grievances list
- [ ] Add address field
- [ ] Implement new FormData structure

### Phase 4: Admin Features
- [ ] Update officer creation form
- [ ] Update grievance list with pagination
- [ ] Update assignment endpoint
- [ ] Update filters

### Phase 5: Officer Features
- [ ] Create assigned grievances endpoint
- [ ] Implement status update flow
- [ ] Implement media upload with type
- [ ] Update status display

---

## 📞 Quick Reference

| Feature | Old | New |
|---------|-----|-----|
| Login field | username | email |
| Create Grievance | POST /api/grievances | POST /api/grievances/create |
| Get Grievances | GET /api/complaints | GET /api/grievances |
| Assign | PUT /api/complaints/{id}/assign | POST /api/assignments |
| Status | PUT /api/complaints/{id}/update | POST /api/grievances/{id}/status |
| Media | PUT /api/grievances/{id}/image | POST /api/grievances/{id}/media |
| Status Enum | String | PENDING, ASSIGNED, IN_PROGRESS, RESOLVED, etc |
| Category | String name | Category ID (hierarchical) |
| Priority | Optional on create | ENUM: LOW, MEDIUM, HIGH, CRITICAL |
| Response | imageUrl | media array |

This is the complete migration guide. Start with Phase 1 and work your way through!
