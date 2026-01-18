# Cascade Integration - Debug Fixes

## Issues Fixed

### 1. **Error Handling Bug** ✅
**Problem:** The error handler tried to access `error.response.json()` but fetch errors don't have a `response` property. This would cause errors when network requests fail.

**Fix:** Updated error handling to:
- Check for `error.data` property (set by our API client)
- Properly handle network errors separately
- Provide clear error messages

### 2. **DOM Query Scope Issues** ✅
**Problem:** All render methods used `document.querySelector()` which could fail if:
- Multiple instances exist
- Elements aren't in the document yet
- Component is used in different contexts

**Fix:** 
- Store container reference in component
- Use `container.querySelector()` for all DOM queries
- Added null checks before querying

### 3. **API Client Error Handling** ✅
**Problem:** Network errors weren't properly distinguished from API errors.

**Fix:**
- Better error parsing for HTTP error responses
- Separate handling for network errors (fetch failures)
- More descriptive error messages
- Proper error data structure

### 4. **Debugging Improvements** ✅
**Problem:** Limited logging made debugging difficult.

**Fix:**
- Added `[Cascade]` and `[API]` prefixes to console logs
- More detailed error messages
- Better error context

## Testing the Fixes

### 1. Test Normal Operation
```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
npm run client
```

Navigate to `http://localhost:3000/cascade` and:
- Select a city (Mumbai, Delhi, or Bangalore)
- Choose a trigger event
- Adjust severity slider
- Click "Simulate Cascade"

**Expected:** Data loads and displays correctly.

### 2. Test Error Handling (Backend Not Running)
```bash
# Stop the backend server, then try to simulate
```

**Expected:** 
- Loading spinner appears
- Error message shows: "Network error: Cannot connect to backend server..."
- Retry button is available

### 3. Test Invalid Parameters
Try with invalid values:
- City ID: 999
- Trigger: "invalid"
- Severity: 2.0

**Expected:** 
- Backend returns 400 error
- Frontend displays error message from backend
- Error message is user-friendly

## Debug Checklist

If issues persist, check:

- [ ] Backend server is running on port 5000
- [ ] Frontend is running on port 3000
- [ ] Vite proxy is configured correctly (check `vite.config.js`)
- [ ] Browser console shows `[API]` and `[Cascade]` logs
- [ ] Network tab shows API requests to `/api/v1/cascading-failure`
- [ ] CORS is enabled on backend (check `server.js`)

## Common Issues & Solutions

### Issue: "Network error: Cannot connect to backend"
**Solution:** Ensure backend is running: `npm run server`

### Issue: "Invalid city_id" error
**Solution:** Use city IDs 1, 2, or 3 (Mumbai, Delhi, Bangalore)

### Issue: "Invalid trigger" error
**Solution:** Use one of: power, water, traffic, communications, emergency, healthcare, transport, financial

### Issue: Elements not found
**Solution:** Check browser console for errors. Ensure component rendered correctly.

### Issue: CORS errors
**Solution:** Backend should have `app.use(cors())` - check `server.js`

## Files Modified

1. `client/src/components/CascadingFailureViz.js`
   - Fixed DOM query scoping
   - Fixed error handling
   - Added container reference
   - Improved logging

2. `client/src/utils/api.js`
   - Improved error handling
   - Better network error detection
   - Enhanced error messages

## Next Steps

If you encounter any issues:
1. Check browser console for `[Cascade]` and `[API]` logs
2. Check network tab for API request/response
3. Verify backend logs show `[CASCADE]` messages
4. Test with different parameters to isolate the issue
