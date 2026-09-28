# Update package.json - Required Dependencies

## Install JWT Decode Library

Since the backend now returns JWT tokens and you need to extract user info from them:

```bash
npm install jwt-decode axios
```

## Updated package.json

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.7",
    "dayjs": "^1.11.19",
    "jwt-decode": "^4.0.0",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^6.30.1",
    "recharts": "^3.4.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.36.0",
    "@types/react": "^19.1.16",
    "@types/react-dom": "^19.1.9",
    "@vitejs/plugin-react-swc": "^4.1.0",
    "eslint": "^9.36.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.22",
    "globals": "^16.4.0",
    "vite": "^7.1.7"
  }
}
```

## Key Changes:

1. **Added `axios`** - For better HTTP client with interceptors
2. **Added `jwt-decode`** - To parse JWT tokens and extract user info
3. Everything else remains the same

## Installation Command:

```bash
npm install
```
