# Troubleshooting Guide

## Can't View the Application?

### Quick Checks

1. **Are servers running?**
   - Check for two PowerShell/terminal windows
   - Backend should show: "Running on http://localhost:5000"
   - Frontend should show: "Local: http://localhost:3000"

2. **Wait for startup**
   - Backend: 5-10 seconds
   - Frontend: 15-20 seconds (first build takes longer)

3. **Check browser**
   - Try: http://localhost:3000
   - Try: http://localhost:3000/cascade
   - Clear browser cache if needed

## Common Issues

### Issue: "Cannot connect" or "Refused to connect"

**Solution:**
1. Check if servers are actually running
2. Look at the server windows for errors
3. Verify ports 5000 and 3000 are not blocked by firewall

### Issue: Port already in use

**Solution:**
```powershell
# Find what's using the port
netstat -ano | findstr ":5000"
netstat -ano | findstr ":3000"

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: Servers won't start

**Solution:**
1. Check Node.js is installed: `node --version`
2. Install dependencies: `npm install` (in root) and `cd client && npm install`
3. Check for error messages in server windows

### Issue: Frontend shows blank page

**Solution:**
1. Wait 20-30 seconds for Vite to finish building
2. Check browser console (F12) for errors
3. Try hard refresh: Ctrl+F5
4. Check frontend window for build errors

### Issue: Backend returns errors

**Solution:**
1. Check backend window for error messages
2. Verify `.env.local` file exists (for API key)
3. Check if port 5000 is available

## Manual Start

If automatic start doesn't work:

### Start Backend:
```powershell
cd au_hack-main
$env:OPENWEATHER_API_KEY="36a4df8166a7e11d2d9375a965d05a59"
npm run server
```

### Start Frontend (in new terminal):
```powershell
cd au_hack-main\client
npm run dev
```

## Verify Installation

```powershell
# Check Node.js
node --version

# Check npm
npm --version

# Install dependencies
npm install
cd client
npm install
cd ..
```

## Still Not Working?

1. **Check server windows** for specific error messages
2. **Check browser console** (F12) for frontend errors
3. **Verify ports** are not blocked by antivirus/firewall
4. **Try different browser** (Chrome, Firefox, Edge)
5. **Check if localhost works**: Try `http://127.0.0.1:3000`

## Expected Behavior

### Backend Window Should Show:
```
╔════════════════════════════════════════════════════════════╗
║  Urban Risk Intelligence Platform - Backend Server         ║
║  Running on http://localhost:5000                          ║
╚════════════════════════════════════════════════════════════╝
```

### Frontend Window Should Show:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## Need Help?

Check the server windows for:
- Error messages (red text)
- Port conflicts
- Missing dependencies
- API key issues

The servers should start automatically. If not, use the manual start commands above.
