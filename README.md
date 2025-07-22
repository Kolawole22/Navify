# Navify Project Status & TODO

## Overview

Navify is a digital address management and navigation platform for Nigeria, supporting both urban and rural addressing. The project consists of a backend API (Node.js/Express/Drizzle/Postgres) and a mobile frontend (Expo/React Native).

---

## Backend (API)

### ✅ Features Implemented

- **User Authentication**

  - OTP request/verification (mocked, not production-ready)
  - Registration (with address, phone, email, password, etc.)
  - Login (JWT-based)
  - Get current user

- **Address Management**

  - Create, update, delete, and fetch addresses (urban & rural)
  - Address categories (fetch all)
  - Search addresses
  - Digital Door Code (DDC) generation (placeholder logic)
  - Rural addressing strategies (landmark, direction, village, etc.)

- **Location Data**

  - Fetch all states
  - Fetch LGAs by state

- **User Management**

  - Get all users
  - Get user by ID

- **Health Check Endpoint**

### 🚧 In Progress / Partially Done

- OTP storage is in-memory (should use Redis or DB)
- Address code uniqueness is not guaranteed
- Some error handling is incomplete (TODOs in controllers)
- No admin-only protection for user endpoints
- No user address relation querying in user endpoints
- No password reset/forgot password flow
- No email/phone verification enforcement
- No user preferences or settings endpoints
- No notification or language preference endpoints
- No location history or analytics endpoints

### ❌ Missing / TODO

- **Settings/Preferences Endpoints**
  - Update user preferences (dark mode, notifications, language, units, etc.)
  - Get/set notification preferences
  - Get/set language and measurement units
  - Save/clear location history
  - Save offline maps (if supported)
  - Privacy policy/terms endpoints (for mobile display)
- **Security**
  - Rate limiting, brute-force protection
  - Secure OTP delivery (SMS integration)
  - Encrypted storage for sensitive data
- **User Profile**
  - Update profile (name, email, phone, photo)
  - Upload profile photo
- **Address Book**
  - Share address with other users
  - Favorite/bookmark addresses
- **Offline Support**
  - Endpoints for offline data sync
- **Analytics**
  - Track address usage, search, navigation history
- **Testing**
  - More comprehensive unit/integration tests
- **Docs**
  - Full OpenAPI/Swagger documentation

---

## Mobile Frontend (Expo/React Native)

### ✅ Features Implemented

- **Onboarding Flow**
  - Multi-step onboarding (benefits, create account, login)
- **Authentication**
  - OTP request (mocked)
  - Registration and login
- **Address Flows**
  - Create new address (urban/rural)
  - Address info, personal info, verification screens
  - View saved/bookmarked addresses
  - Address search and map display
  - Navigation screen (mocked steps, map, directions)
- **Tab Navigation**
  - Home, Bookmark, Profile, More tabs
- **Settings Screen (UI)**
  - Dark mode toggle (UI only)
  - Notifications toggle (UI only)
  - Language selection (UI only)
  - Units selection (UI only)
  - Location history toggle (UI only)
  - Save offline maps toggle (UI only)
  - Clear data (UI only)
  - About, Privacy Policy, Terms (UI only, Alert popups)
- **Profile Screen**
  - View user info, logout

### 🚧 In Progress / Partially Done

- Most settings toggles are UI-only; no backend integration
- Offline maps, location history, notifications, language, and units are not persisted or functional
- Feedback, Help & Support, and About are placeholders (Alert popups)
- No profile photo upload
- No password reset/forgot password flow
- No deep linking/universal links
- No push notifications
- No analytics or usage tracking

### ❌ Missing / TODO

- **Settings Functionality**
  - Integrate all settings toggles with backend endpoints
  - Persist user preferences (dark mode, notifications, language, units)
  - Implement location history (save, view, clear)
  - Implement offline maps (download, manage)
  - Privacy policy and terms: fetch from backend or static page
- **Profile**
  - Edit profile (name, email, phone, photo)
  - Change password
  - Forgot password flow
- **Address Book**
  - Share address (via link, QR, etc.)
  - Favorite/bookmark addresses (sync with backend)
- **Notifications**
  - Push notification setup and preferences
- **Offline Support**
  - Local cache of addresses, maps, and history
- **Accessibility**
  - Improve a11y for all screens
- **Testing**
  - Add more unit/integration tests (Jest, Detox)
- **Security**
  - Use encrypted storage for sensitive data
  - Sanitize all user inputs

---

## General / Cross-Cutting

### ❌ TODO

- Full E2E testing (backend + mobile)
- CI/CD setup for both backend and mobile
- Documentation for API and mobile usage
- Error logging and monitoring (Sentry, expo-error-reporter)
- Analytics (usage, crash reporting)
- Multi-language support (i18n)
- Community validation/feedback for addresses
- Machine learning for address suggestions (future)

---

## How to Use This TODO

- Use this checklist to prioritize development.
- For each mobile setting, create a corresponding backend endpoint.
- Ensure all user actions (settings, address book, etc.) are persisted and synced.
- Add missing features and improve error handling, security, and testing.

---

**This file is auto-generated based on the current codebase. Update as features are completed or added.**
