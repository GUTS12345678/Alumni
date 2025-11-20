# Cloudflare SSL Certificate Installation Guide for XAMPP

## ✅ SSL Certificate Files Created

1. **Certificate:** `C:\xampp\apache\conf\ssl.crt\akndev.tech.crt`
2. **Private Key:** `C:\xampp\apache\conf\ssl.key\akndev.tech.key`
3. **Virtual Host Config:** `C:\xampp\apache\conf\extra\httpd-akndev.conf`

---

## 📝 Manual Configuration Steps

### Step 1: Enable SSL Module in Apache

1. Open `C:\xampp\apache\conf\httpd.conf` in a text editor (Notepad++)
2. Find this line (around line 145):
   ```apache
   #LoadModule ssl_module modules/mod_ssl.so
   ```
3. **Remove the `#`** to uncomment it:
   ```apache
   LoadModule ssl_module modules/mod_ssl.so
   ```

### Step 2: Include SSL Configuration

1. In the same `httpd.conf` file, scroll down to around line 520
2. Find this line:
   ```apache
   #Include conf/extra/httpd-ssl.conf
   ```
3. **Remove the `#`** to uncomment it:
   ```apache
   Include conf/extra/httpd-ssl.conf
   ```

### Step 3: Include Your Custom Virtual Host

1. At the **bottom** of `httpd.conf`, add this line:
   ```apache
   Include conf/extra/httpd-akndev.conf
   ```

### Step 4: Restart Apache

1. Open **XAMPP Control Panel**
2. Click **Stop** on Apache
3. Wait 2-3 seconds
4. Click **Start** on Apache
5. Check for errors in the **Logs** button

---

## 🧪 Test Your SSL Certificate

After restarting Apache:

1. Open browser: `https://localhost`
2. Open browser: `http://akndev.tech` (via Cloudflare tunnel)
3. Check for SSL padlock icon

---

## ⚡ Quick Setup Commands (Run in PowerShell as Administrator)

```powershell
# Backup original config
Copy-Item "C:\xampp\apache\conf\httpd.conf" "C:\xampp\apache\conf\httpd.conf.backup"

# Enable SSL module
(Get-Content "C:\xampp\apache\conf\httpd.conf") -replace '#LoadModule ssl_module modules/mod_ssl.so', 'LoadModule ssl_module modules/mod_ssl.so' | Set-Content "C:\xampp\apache\conf\httpd.conf"

# Enable SSL config
(Get-Content "C:\xampp\apache\conf\httpd.conf") -replace '#Include conf/extra/httpd-ssl.conf', 'Include conf/extra/httpd-ssl.conf' | Set-Content "C:\xampp\apache\conf\httpd.conf"

# Add custom vhost include
Add-Content "C:\xampp\apache\conf\httpd.conf" "`nInclude conf/extra/httpd-akndev.conf"
```

---

## 🔍 Troubleshooting

**If Apache won't start:**
1. Check Apache error log: `C:\xampp\apache\logs\error.log`
2. Run config test: `C:\xampp\apache\bin\httpd.exe -t`
3. Restore backup: Copy `httpd.conf.backup` to `httpd.conf`

**Port 443 already in use:**
- Check what's using it: `netstat -ano | findstr :443`
- Stop the conflicting service or change Apache SSL port

---

## ✅ What This Enables

- ✅ HTTPS support on Apache (port 443)
- ✅ Cloudflare Origin Certificate installed
- ✅ Virtual host for akndev.tech
- ✅ Wildcard support (*.akndev.tech)
- ✅ Laravel public folder as document root
- ✅ Custom error and access logs

---

**Certificate Valid Until:** November 8, 2040 (15 years)
