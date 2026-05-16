# lib/ — API Client, Validators & Utilities

## Directory Structure

```
lib/
├── api/
│   ├── client.ts              # Axios instance, interceptors, refresh queue (Singleton)
│   ├── index.ts               # Barrel export for all API modules
│   ├── auth/                  # Auth endpoint functions
│   │   ├── login.ts           # login(payload) -> LoginApiResponse
│   │   ├── registerRequest.ts # register(payload) -> RegisterApiResponse
│   │   ├── onboarding.ts      # completeOnboarding(payload)
│   │   ├── verifyEmail.ts     # verifyEmail(userId, token)
│   │   ├── resendVerification.ts
│   │   ├── forgotPassword.ts
│   │   ├── resetPassword.ts
│   │   ├── me.ts              # getCurrentUser()
│   │   ├── logout.ts          # logout()
│   │   └── index.ts           # Barrel export
│   ├── stations/              # Station resource endpoints
│   │   ├── fuel-types.ts      # getFuelTypesByStation, createFuelType, deleteFuelType
│   │   ├── fuel-prices.ts     # getFuelPricesByStation, setFuelPrice
│   │   ├── fuel-tanks.ts      # getFuelTanksByStation, createFuelTank
│   │   ├── fuel-nozzles.ts    # getFuelNozzlesByStation, createFuelNozzle
│   │   └── index.ts
│   ├── omcs.ts                # getOMCs()
│   ├── omc-fuel-types.ts      # getOMCFuelTypes()
│   └── station-management.ts  # createStation, getOrganizationStations
├── validators/
│   └── auth.ts                # Zod schemas for auth forms
├── utils.ts                   # cn() — clsx + tailwind-merge
└── theme-context.ts           # ThemeProviderContext, useTheme() hook
```

## API Client (`api/client.ts`) — Singleton Axios Instance

**Configuration:**
- Base URL: `VITE_API_BASE_URL` env var (default `http://localhost:5035/api/v1`)
- `withCredentials: true` — sends HTTP-only cookies automatically
- Content-Type: `application/json`

**401 Interceptor — Refresh Queue Pattern:**
```
Request fails with 401
  ├── Is it a login/register endpoint? → Return 401 to component (let form handle it)
  ├── Is a refresh already in progress? → Queue the request, wait for refresh
  └── First 401? → Call /auth/refreshToken
       ├── Success → Retry original request + all queued requests
       └── Failure → Call onAuthFailure() (logout + redirect to /auth/login)
```

Endpoints that return 401 to the component (not intercepted): `/auth/login`, `/auth/register`

**Setup in `main.tsx`:**
```typescript
setupAuthFailureHandler(() => {
  useAuthStore.getState().logout();
  window.location.href = "/auth/login";
});
```

**Exported helpers:**
```typescript
api.get<T>(endpoint: string): Promise<T>      // Returns response.data
api.post<T>(endpoint: string, data): Promise<T>
api.put<T>(endpoint: string, data): Promise<T>
api.delete<T>(endpoint: string): Promise<T>
```

## API Module Pattern (SRP: One File Per Resource)

Each API file exports typed functions:

```typescript
// lib/api/stations/fuel-types.ts
export interface FuelTypeDto { id: string; name: string; unit: string; isCustom: boolean; }

export const getFuelTypesByStation = (stationId: string) =>
  api.get<{ success: boolean; data: FuelTypeDto[] }>(`/fuel-types?stationId=${stationId}`);

export const createFuelType = (stationId: string, payload: CreateFuelTypePayload) =>
  api.post<{ success: boolean; data: FuelTypeDto }>(`/fuel-types`, { ...payload, stationId });
```

**Rules:**
- One file per backend resource (maps to one controller)
- Export typed request/response interfaces alongside functions
- All functions return typed `{ success: boolean; data: T }`
- Barrel-export from `index.ts` in each folder
- Use the `api` helpers from `client.ts` — never import Axios directly

## API Response Type Convention

Backend always returns: `{ success: boolean; data: T }`

```typescript
// Standard response wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// Nested for login (data.data pattern)
interface LoginApiResponse {
  data: LoginResponse;  // { expiresIn, user, organization?, subscription?, stations? }
}
```

## Validators (`validators/auth.ts`) — Zod Schemas as Validation Strategies

Each schema exports both the schema and inferred TypeScript type:

```typescript
export const registerSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\+92\d{10}$/, "Must be +92XXXXXXXXXX format"),
  password: z.string()
    .min(6, "At least 6 characters")
    .regex(/\d/, "Must contain at least one number"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
```

**Available schemas:** `registerSchema`, `loginSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `onboardingSchema`

**Rules:**
- Mirror backend FluentValidation rules (same constraints, same messages where possible)
- Pakistani phone: `+92` prefix + 10 digits
- Password: min 6 chars + at least 1 digit
- Use `.refine()` for cross-field validation (password confirmation)
- Export `z.infer<typeof schema>` as the TypeScript type

## Utilities (`utils.ts`)

```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Single utility. Used everywhere for Tailwind class merging. Handles conflicts (e.g., `p-2` vs `p-4`).

## Adding a New API Module

1. Create file in `api/{resource}/` or `api/{resource}.ts`
2. Define request/response interfaces
3. Export typed functions using `api.get/post/put/delete`
4. Add barrel export in `api/index.ts`
5. Create corresponding Zod schema in `validators/` if forms will use it
