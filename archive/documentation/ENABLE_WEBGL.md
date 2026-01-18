# How to Enable WebGL in Chrome

If the background animation is not showing, WebGL might be disabled in your browser. Here's how to enable it:

## Chrome Settings

1. **Open Chrome Settings:**
   - Click the three dots (⋮) in the top right
   - Go to **Settings**

2. **Enable Hardware Acceleration:**
   - Go to **System** (or search for "hardware")
   - Make sure **"Use hardware acceleration when available"** is **ON**
   - Restart Chrome

3. **Check WebGL Status:**
   - Go to: `chrome://gpu` in the address bar
   - Look for "WebGL" - it should say "Hardware accelerated"
   - If it says "Software only" or "Unavailable", WebGL is disabled

4. **Enable WebGL if Disabled:**
   - Go to: `chrome://flags` in the address bar
   - Search for "WebGL"
   - Make sure **"WebGL 2.0"** is **Enabled**
   - Restart Chrome

## Alternative: Use Different Browser

If Chrome won't enable WebGL:
- Try **Firefox** or **Edge**
- They may have different WebGL settings

## Check if WebGL Works

After enabling, refresh the page. The background city animation should appear.

If it still doesn't work, check the browser console (F12) for any WebGL errors.
