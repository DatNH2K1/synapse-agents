---
name: synapse-mobile
description: |-
  Provides advanced methodologies, best practices, and runtime checklists for constructing premium native and cross-platform mobile applications.

  MANDATORY: Execute when developing, debugging, or testing mobile application logic, views, or platform-specific configurations.

  Trigger immediately for:
    - react native
    - flutter
    - ios deployment
    - android build
    - mobile viewport layout

  DO NOT trigger for:
    - Pure web backend development.
    - Static website development.
---

# 📱 synapse-mobile — Mobile Development Core Skill

This skill equips the Agent with advanced methodologies, best practices, and runtime checklists for constructing premium native and cross-platform mobile applications.

---

## 🌟 CORE PRINCIPLES

1. **Layout Integrity**: Design with absolute adherence to Safe Area Insets, Notch dimensions, and soft-keys.
2. **Smooth Frame Rate (60/120 FPS)**: Avoid overdraw, expensive JavaScript execution during rendering, and synchronous storage blocks.
3. **Offline-First Resilience**: Implement robust cache, persistent store mechanisms, and elegant offline placeholders.
4. **Platform Harmony**: Respect the distinct interface guidelines and UX patterns of iOS (Human Interface Guidelines) and Android (Material Design).

---

## 🛠️ ARCHITECTURAL PLAYBOOKS

### 1. Cross-Platform Frameworks (React Native & Flutter)

#### A. React Native (TypeScript)

- **Performance Rule**: Use `FlatList` or `FlashList` (Shopify) for lists. Never use standard `ScrollView` for dynamic or large datasets.
- **Component Styling**: Rely on native styling or highly optimized styling libraries. Avoid unnecessary re-renders by wrapping complex lists in `React.memo` and passing dependencies via `useCallback` or `useMemo`.
- **State Management**: Use lightweight reactive stores (Zustand, Recoil) or TanStack Query for server cache. Keep the main JS Thread clear of heavy compute.

#### B. Flutter (Dart)

- **Widget Structure**: Build lightweight stateless widgets where possible. Avoid calling heavy logic inside standard `build()` methods.
- **State Management**: Implement BLoC, Provider, or Riverpod with fine-grained context updates to prevent broad screen redraws.
- **Asset Loading**: Compress vector assets (use SVGs or Lottie for micro-animations) and cache images using `cached_network_image`.

### 2. Native Systems (iOS Swift & Android Kotlin)

#### A. iOS (Swift / SwiftUI)

- Use `SwiftUI` for modular, fast UI construction; fall back to `UIKit` with `UIViewRepresentable` for complex custom components.
- Enforce dynamic type sizes so elements scale correctly with user accessibility settings.
- Manage async tasks safely using Swift Concurrency (`async`/`await`, `Task`, `Actors`).

#### B. Android (Kotlin / Jetpack Compose)

- Leverage `Jetpack Compose` for modern layout building. Enforce proper `@Stable` and `@Immutable` tagging on data models.
- Use `Coroutines` and `Flow` for reactive architecture.
- Avoid heavy storage transactions on the main UI thread (use Dispatchers.IO for SQLite/Room transactions).

---

## 📐 MOBILE LAYOUT CHEATSHEET

### 1. Safe Area & Notches

- Always wrap screens in `SafeAreaView` (React Native) or `SafeArea` (Flutter).
- When building custom headers or absolute overlays, dynamically retrieve window insets rather than hardcoding paddings:
  - React Native: Use `react-native-safe-area-context`.
  - Flutter: Use `MediaQuery.of(context).padding`.

### 2. Screen Dimensions & Responsive Typography

- Do not hardcode raw pixel sizes. Use relative scales based on a standard 375dp (iPhone width) layout.
- Handle scaling for extremely small devices (e.g., iPhone SE) vs large devices (e.g., iPad, tablet).
- Wrap text strings inside scrolling elements when dynamic font size overrides could overflow bounded containers.

---

## 🧪 MOBILE TESTING & QUALITY ASSURANCE

- **Unit Testing**: Target core state stores, dynamic formatters, and custom hooks/helpers using Jest (React Native) or Dart Test (Flutter).
- **E2E / Integration Testing**: Utilize **Detox** or **Appium** to automate physical device/simulator flows.
- **Accessibility (a11y)**:
  - Ensure every interactive element has `accessible={true}` and a clear `accessibilityLabel`.
  - Maintain color contrast ratios complying with WCAG AA guidelines.

---

## 🛡️ MOBILE RELEASE CHECKLIST

- [ ] **Bundle Optimization**: Run Proguard (Android) and strip unused architectures (iOS). Ensure dead code is eliminated.
- [ ] **Asset Compression**: Compress vector graphics and scale PNG/JPEG resources to matching @2x/@3x densities.
- [ ] **Permission Sandboxing**: Only request critical runtime permissions (Camera, Location) JIT (Just-In-Time) when requested by a feature.
- [ ] **Error Catching**: Set up a top-level Error Boundary and integrate crash reporting (Sentry/Firebase Crashlytics).
