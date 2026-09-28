
# Frontend Microservice Migration Summary

## Updated Areas

- Migrated API base URL to API Gateway (`localhost:8080`)
- Replaced fetch API with axios
- Added JWT decoding support
- Updated authentication APIs
- Added OTP-based auth helpers
- Updated grievance APIs to microservice endpoints
- Added assignment APIs
- Added grievance media upload APIs
- Added paginated grievance support
- Added master-data APIs:
  - categories
  - departments
  - districts
  - mandals
- Added Excel export support

## Important UI Changes Still Required

You should now update React components to use:

- `categoryId` instead of category name
- `mandalId` instead of district text
- ENUM statuses:
  - PENDING
  - ASSIGNED
  - IN_PROGRESS
  - RESOLVED
  - REJECTED
  - REOPENED

## Officer Creation Form

Officer creation now requires:

- departmentId
- mandalId
- districtId

## Media Handling

Use:

- BEFORE
- AFTER
- DOCUMENT

instead of old imageUrl fields.
