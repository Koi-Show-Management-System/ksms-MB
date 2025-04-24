# SafeAreaView Usage Guide

This document explains how to use SafeAreaView in the KSMS application to ensure proper display on devices with notches, home indicators, and other UI elements that might intrude into the app's space.

## What is SafeAreaView?

SafeAreaView is a component from the `react-native-safe-area-context` library that automatically adds padding to your content to avoid system UI elements like the notch on iPhones or the home indicator at the bottom of the screen. It also handles Android display cutouts and notches properly.

## How SafeAreaView is Implemented in KSMS

The application now uses SafeAreaView in several key places:

1. **Root Layout**: The app already had a `SafeAreaProvider` in the root layout (`app/_layout.tsx`).
   - Added `AndroidSafeAreaConfig` component to handle Android-specific settings

2. **Layout Components**:
   - `LayoutWithHeader`: Uses SafeAreaView with `edges={['top']}` to handle top insets
   - `DefaultLayout`: Uses SafeAreaView with all edges for complete protection
   - `SafeAreaLayout`: A new utility component for screens that don't use the layout system
   - `EnhancedSafeAreaView`: A new component that properly handles Android cutouts and notches

3. **Individual Screens**: Some screens already used SafeAreaView directly.

4. **Android Configuration**:
   - Added Android-specific configuration for display cutouts
   - Set up proper edge-to-edge display on Android devices

## How to Use SafeAreaView in Your Screens

### Option 1: Use the Layout System (Recommended)

Most screens should use the layout system which already includes SafeAreaView:

```tsx
import MainLayout from '@/components/MainLayout';

export default function MyScreen() {
  return (
    <MainLayout title="My Screen" description="Description" showFooter={true}>
      {/* Your content here */}
    </MainLayout>
  );
}
```

### Option 2: Use EnhancedSafeAreaView for Better Android Support (Recommended)

For screens that need better Android cutout support, use the EnhancedSafeAreaView component:

```tsx
import EnhancedSafeAreaView from '@/components/EnhancedSafeAreaView';

export default function MyCustomScreen() {
  return (
    <EnhancedSafeAreaView backgroundColor="#FFFFFF">
      {/* Your content here */}
    </EnhancedSafeAreaView>
  );
}
```

You can customize which edges to apply safe area insets to:

```tsx
<EnhancedSafeAreaView
  edges={['top', 'bottom']}
  backgroundColor="#FFFFFF"
  mode="padding"
>
  {/* Only apply safe area to top and bottom */}
</EnhancedSafeAreaView>
```

### Option 3: Use SafeAreaLayout for Custom Screens

For screens that need a custom layout but still need safe area insets:

```tsx
import SafeAreaLayout from '@/components/SafeAreaLayout';

export default function MyCustomScreen() {
  return (
    <SafeAreaLayout>
      {/* Your content here */}
    </SafeAreaLayout>
  );
}
```

You can customize which edges to apply safe area insets to:

```tsx
<SafeAreaLayout edges={['top', 'bottom']}>
  {/* Only apply safe area to top and bottom */}
</SafeAreaLayout>
```

### Option 4: Direct Usage

For very custom screens, you can use SafeAreaView directly:

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyVeryCustomScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'right', 'bottom', 'left']}>
      {/* Your content here */}
    </SafeAreaView>
  );
}
```

## Edge Options

The `edges` prop controls which edges get safe area insets:

- `['top']`: Only apply to the top (status bar area)
- `['bottom']`: Only apply to the bottom (home indicator area)
- `['left', 'right']`: Only apply to the sides
- `['top', 'right', 'bottom', 'left']`: Apply to all edges (default)

## Styling

When using SafeAreaView, make sure to:

1. Set `flex: 1` on the SafeAreaView to make it fill the screen
2. Set a background color on the SafeAreaView to ensure the safe areas match your UI

## Troubleshooting

If you notice content being cut off by system UI elements:

1. Make sure the screen is using SafeAreaView
2. Check that the correct edges are specified
3. Verify that the SafeAreaProvider is wrapping the entire app (already done in `app/_layout.tsx`)

### Android-Specific Issues

For Android devices with notches or cutouts:

1. Make sure the `AndroidSafeAreaConfig` component is included in your root layout
2. Use `EnhancedSafeAreaView` for screens that have issues with cutouts
3. Check the Android manifest configuration (see `docs/AndroidCutoutSupport.md`)
4. Test on different Android devices with various cutout shapes
5. For Android 15+ devices, ensure you're using the correct `layoutInDisplayCutoutMode`

### Testing Android Cutouts

You can simulate cutouts on any Android device (API level 28+):

1. Enable Developer Options
2. Go to Settings > Developer Options > Display cutout
3. Select a cutout type to test with
4. Rotate the device to test both portrait and landscape modes
