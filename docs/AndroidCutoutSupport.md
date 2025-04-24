# Android Cutout Support Configuration

To properly support display cutouts on Android devices, you need to add specific configurations to your Android manifest file. Follow these steps:

## 1. Update AndroidManifest.xml

Add the following attribute to your activity in the `android/app/src/main/AndroidManifest.xml` file:

```xml
<activity
    android:name=".MainActivity"
    ...
    android:windowLayoutInDisplayCutoutMode="shortEdges"
    ...>
    ...
</activity>
```

This setting allows your app to render content into the cutout area on the short edges of the display in both portrait and landscape modes.

## 2. Update MainActivity.kt (Optional)

For more control, you can also set the cutout mode programmatically in your MainActivity.kt file:

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Set window flags for edge-to-edge display
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        window.attributes.layoutInDisplayCutoutMode = 
            WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
    }
    
    // Make status bar transparent
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        window.setDecorFitsSystemWindows(false)
    } else {
        window.decorView.systemUiVisibility = 
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or 
            View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
    }
    window.statusBarColor = Color.TRANSPARENT
}
```

## 3. Test on Different Devices

Test your app on devices with different types of cutouts. If you don't have a physical device with a cutout, you can simulate one using the Android Emulator:

1. Enable Developer Options on your emulator
2. Go to Settings > Developer Options > Display cutout
3. Select a cutout type to simulate

## 4. Best Practices

- Avoid placing critical UI elements in the cutout area
- Use `WindowInsetsCompat` to get the safe insets for your layout
- Test in both portrait and landscape orientations
- Consider using different layouts for devices with and without cutouts

## 5. Handling Different Android Versions

For Android 15 (API level 35) and higher, the system enforces edge-to-edge display by default. For older versions, you need to explicitly enable it as shown above.

For more information, refer to the [Android Developer documentation on display cutouts](https://developer.android.com/develop/ui/views/layout/display-cutout).
