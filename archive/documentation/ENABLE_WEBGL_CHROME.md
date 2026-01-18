# How to Enable WebGL in Chrome - URGENT FIX

## The Problem
Chrome shows: "Sandboxed = yes, GL_VENDOR = Disabled, GL_RENDERER = Disabled"
This means WebGL is **completely disabled** in your Chrome browser.

## Quick Fix (5 minutes)

### Step 1: Enable Hardware Acceleration
1. Open Chrome
2. Go to: `chrome://settings/system` (or Settings → System)
3. Find: **"Use hardware acceleration when available"**
4. Make sure it's **TURNED ON** ✅
5. Click **"Relaunch"** button at the bottom

### Step 2: Enable WebGL Flags
1. Go to: `chrome://flags` in address bar
2. Search for: **"WebGL"**
3. Find: **"WebGL 2.0"**
4. Set it to: **"Enabled"**
5. Search for: **"Hardware-accelerated"**
6. Find: **"Hardware-accelerated video decode"**
7. Set it to: **"Enabled"**
8. Click **"Relaunch"** button at the bottom

### Step 3: Check WebGL Status
1. Go to: `chrome://gpu` in address bar
2. Look for these lines:
   - **WebGL:** Should say "Hardware accelerated" ✅
   - **WebGL2:** Should say "Hardware accelerated" ✅
   - **Sandboxed:** Should say "No" (not "Yes")

### Step 4: Test
1. Restart Chrome completely
2. Go to your app
3. Check console (F12) - should see: "✅ CityEnvironment initialized successfully"
4. Background animation should appear!

## If Still Not Working

### Option A: Check Graphics Drivers
1. Update your graphics drivers (NVIDIA/AMD/Intel)
2. Restart computer
3. Try again

### Option B: Chrome Reset
1. Go to: `chrome://settings/reset`
2. Click: **"Restore settings to their original defaults"**
3. Then follow steps above again

### Option C: Use Different Browser
- **Firefox** or **Edge** may have WebGL enabled by default
- Test if animation works there

## Why This Happens
- Chrome sometimes disables WebGL for security/sandboxing
- Hardware acceleration might be off
- Graphics drivers might be outdated
- Corporate/school networks might block WebGL

## Expected Result
After enabling:
- ✅ No more "Sandboxed = yes" errors
- ✅ Background animation visible
- ✅ Console shows "CityEnvironment initialized successfully"
