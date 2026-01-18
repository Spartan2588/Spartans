# QUICK FIX - Map Not Showing

## Immediate Steps:

1. **Open Browser Console (F12)** and check for errors
2. **Hard Refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. **Check Network Tab**: Verify Leaflet CSS and JS are loading

## If Map Still Doesn't Show:

The map container now has:
- Explicit height: 600px
- Loading indicator
- Better error messages
- Console logging for debugging

## What to Check in Console:

Look for these messages:
- ✅ "Leaflet loaded successfully" - Good!
- ✅ "Map initialized successfully" - Good!
- ❌ "Leaflet library not loaded" - CDN issue
- ❌ "Error initializing map" - Check error details

## Common Issues:

1. **Blank Screen**: 
   - Check if `#map-container` has height (should be 600px)
   - Check browser console for errors

2. **"Leaflet not found"**:
   - Check internet connection
   - Try loading: https://unpkg.com/leaflet@1.9.4/dist/leaflet.js in browser
   - If blocked, the CDN might be down

3. **Map loads but no tiles**:
   - OpenStreetMap tiles might be blocked
   - Check Network tab for failed tile requests

## Emergency Fallback:

If Leaflet CDN fails, you can:
1. Download Leaflet locally
2. Or use a different CDN (jsDelivr, cdnjs)

But the current setup should work if internet is available.
