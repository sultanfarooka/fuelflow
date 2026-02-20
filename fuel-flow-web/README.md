# Fuel Flow - Frontend

> Comprehensive filling station management system for the Pakistani market

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
fuel-flow-web/
├── src/
│   ├── routes/           # TanStack Router file-based routes
│   │   ├── __root.tsx    # Root layout
│   │   ├── index.tsx     # Home page (/)
│   │   ├── about.tsx     # About page (/about)
│   │   ├── dashboard/    # Dashboard routes
│   │   └── stations/     # Station routes
│   ├── components/
│   │   ├── ui/          # Shadcn UI components (to be added)
│   │   ├── forms/       # Form components
│   │   └── layout/      # Layout components (Header, Sidebar, etc.)
│   ├── hooks/
│   │   ├── queries/     # TanStack Query hooks
│   │   └── useAuth.ts   # Auth hook (to be created)
│   ├── lib/
│   │   ├── api.ts       # API client with JWT auth
│   │   ├── utils.ts     # Utility functions
│   │   └── validators.ts # Zod schemas (to be added)
│   ├── stores/
│   │   └── themeStore.ts # Zustand theme store
│   ├── locales/         # i18n translations
│   │   ├── en.json      # English
│   │   └── ur.json      # Urdu
│   └── main.tsx         # App entry point
├── public/              # Static assets
├── .env                 # Environment variables
└── vite.config.ts       # Vite configuration
```

## 🛠️ Tech Stack

### Core
- **React 19.2** - UI library
- **TypeScript 5.9** - Type safety
- **Vite 7.2** - Build tool & dev server

### Routing & Data
- **TanStack Router 1.x** - Type-safe file-based routing
- **TanStack Query 5.x** - Server state management
- **TanStack Table 8.x** - Headless tables

### Forms & Validation
- **TanStack Form** - Form state and validation (Zod adapter)
- **Zod 3.x** - Schema validation

### State & UI
- **Zustand 4.x** - Client state management
- **Tailwind CSS 3.x** - Utility-first styling
- **Lucide React** - Icons

### Charts & i18n
- **Recharts 2.x** - Data visualization
- **react-i18next** - Internationalization (English + Urdu)

## 🎨 Features Implemented

### ✅ Phase 1.1 Complete
- [x] React + Vite + TypeScript setup
- [x] TanStack Router with file-based routing
- [x] TanStack Query for data fetching
- [x] Tailwind CSS with dark mode support
- [x] Theme management (light/dark/system)
- [x] API client with JWT auth
- [x] i18n setup (English + Urdu)
- [x] Project structure following PRD
- [x] Dev environment ready

## 🌐 API Configuration

Update `.env` with your backend API URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## 🎨 Dark Mode

Dark mode is implemented and can be toggled:

```typescript
import { useThemeStore } from '@/stores/themeStore'

function MyComponent() {
  const { theme, setTheme } = useThemeStore()
  
  // Change theme
  setTheme('dark')  // or 'light' or 'system'
}
```

## 🌍 Internationalization

Use the i18n system for multilingual support:

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t, i18n } = useTranslation()
  
  return <h1>{t('common.welcome')}</h1>
  
  // Change language
  i18n.changeLanguage('ur') // Switch to Urdu
}
```

## 📝 Adding Routes

TanStack Router uses file-based routing. Add files to `src/routes/`:

```typescript
// src/routes/stations/$stationId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/stations/$stationId')({
  component: StationDetail,
})

function StationDetail() {
  const { stationId } = Route.useParams() // Type-safe!
  return <div>Station {stationId}</div>
}
```

Routes are automatically generated in `src/routeTree.gen.ts`.

## 🔐 API Client Usage

```typescript
import { api } from '@/lib/api'

// GET request
const stations = await api.get('/stations')

// POST request
const newStation = await api.post('/stations', {
  name: 'Al-Madina Station',
  address: '...'
})

// PUT request
await api.put('/stations/123', { name: 'Updated Name' })

// DELETE request
await api.delete('/stations/123')
```

## 📦 Utility Functions

```typescript
import { cn, formatCurrency, formatDate } from '@/lib/utils'

// Merge Tailwind classes
cn('text-red-500', condition && 'font-bold')

// Format Pakistani currency
formatCurrency(125000) // "Rs 1,25,000"

// Format date (DD/MM/YYYY)
formatDate(new Date()) // "08/02/2026"
```

## 🚀 Next Steps

See **[Implementation Status](../docs/IMPLEMENTATION_STATUS.md)** for current state and where to continue.

**Next up:** 1.4c (Subscription plan seeding), 1.6 (Organization & Station CRUD), 1.8 (Basic UI shell)

## 📖 Documentation

- **PRD**: `docs/PRD.md` - Complete technical specifications
- **Project Overview**: `docs/ProjectOverView.md` - Business requirements
- **Implementation Status**: `docs/IMPLEMENTATION_STATUS.md` - What's done, where to continue
- **Cursor Rules**: `.cursorrules` - AI development guidelines

## 🤝 Development Guidelines

Follow the cursor rules in `.cursorrules` for:
- Code conventions
- Architecture patterns
- Business rules
- Multi-tenancy patterns
- Testing approach

---

**Phase 1.1 Status**: ✅ Complete  
**Next Phase**: See [Implementation Status](../docs/IMPLEMENTATION_STATUS.md)
