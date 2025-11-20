# Cloudflare Tunnel Setup for akndev.tech

## Step 1: Install Cloudflared on Windows

1. Download Cloudflared for Windows:
   ```
   https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
   ```

2. Create a directory and rename the file:
   ```powershell
   New-Item -ItemType Directory -Path C:\Cloudflared -Force
   # Move the downloaded file to C:\Cloudflared\cloudflared.exe
   ```

## Step 2: Authenticate with Cloudflare

Open PowerShell as Administrator and run:

```powershell
C:\Cloudflared\cloudflared.exe tunnel login
```

This will open your browser to authenticate with Cloudflare. Select your `akndev.tech` domain.

## Step 3: Create a Tunnel

```powershell
C:\Cloudflared\cloudflared.exe tunnel create alumni-tracer
```

This creates a tunnel named "alumni-tracer" and generates:
- A tunnel UUID (save this!)
- A credentials JSON file in `%USERPROFILE%\.cloudflared\`

## Step 4: Create Configuration File

Create a file at `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: YOUR-TUNNEL-UUID-HERE
credentials-file: C:\Users\YOUR-USERNAME\.cloudflared\YOUR-TUNNEL-UUID.json

ingress:
  # Main domain - routes to your Laravel app on XAMPP
  - hostname: akndev.tech
    service: http://localhost:80
  
  # www subdomain
  - hostname: www.akndev.tech
    service: http://localhost:80
  
  # Catch-all rule (required)
  - service: http_status:404
```

Replace:
- `YOUR-TUNNEL-UUID-HERE` with the UUID from Step 3
- `YOUR-USERNAME` with your Windows username
- `YOUR-TUNNEL-UUID.json` with the actual filename

## Step 5: Configure DNS in Cloudflare Dashboard

1. Log into Cloudflare Dashboard: https://dash.cloudflare.com
2. Select your `akndev.tech` domain
3. Go to **DNS** → **Records**
4. Add CNAME records for your tunnel:

```
Type: CNAME
Name: @
Target: e4aa51ee-2ef7-46ce-9e3e-2131fa2694cc.cfargotunnel.com
Proxied: Yes (Orange cloud)
```

```
Type: CNAME
Name: www
Target: YOUR-TUNNEL-UUID.cfargotunnel.com
Proxied: Yes (Orange cloud)
```

## Step 6: Configure SSL/TLS in Cloudflare

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to: **Full**
3. Go to **SSL/TLS** → **Edge Certificates**
4. Enable:
   - ✅ Always Use HTTPS
   - ✅ Automatic HTTPS Rewrites
   - ✅ Minimum TLS Version: 1.2

## Step 7: Run the Tunnel

```powershell
C:\Cloudflared\cloudflared.exe tunnel run alumni-tracer
```

Your site should now be accessible at https://akndev.tech

## Step 8: Run Tunnel as Windows Service (Optional but Recommended)

To keep the tunnel running permanently:

```powershell
C:\Cloudflared\cloudflared.exe service install
```

Then start the service:

```powershell
Start-Service cloudflared
```

## Step 9: Configure Apache Virtual Host (Optional)

Create file: `C:\xampp\apache\conf\extra\httpd-vhosts.conf`

Add:

```apache
<VirtualHost *:80>
    ServerName akndev.tech
    ServerAlias www.akndev.tech
    DocumentRoot "C:/xampp/htdocs/public"
    
    <Directory "C:/xampp/htdocs/public">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog "logs/akndev.tech-error.log"
    CustomLog "logs/akndev.tech-access.log" common
</VirtualHost>
```

Then restart Apache in XAMPP Control Panel.

## Troubleshooting

### Check Tunnel Status
```powershell
C:\Cloudflared\cloudflared.exe tunnel list
```

### View Tunnel Logs
```powershell
C:\Cloudflared\cloudflared.exe tunnel info alumni-tracer
```

### Test Local DNS
Add to `C:\Windows\System32\drivers\etc\hosts` (requires admin):
```
127.0.0.1 akndev.tech
127.0.0.1 www.akndev.tech
```

### Clear Laravel Cache
```powershell
cd C:\xampp\htdocs
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

## Security Checklist

- ✅ APP_DEBUG=false in .env
- ✅ APP_ENV=production in .env
- ✅ SESSION_SECURE_COOKIE=true
- ✅ Cloudflare SSL enabled
- ✅ HTTPS redirect enabled
- ✅ Proper file permissions on .env

## Useful Commands

**Stop tunnel:**
```powershell
Stop-Service cloudflared
```

**Restart tunnel:**
```powershell
Restart-Service cloudflared
```

**Check service status:**
```powershell
Get-Service cloudflared
```

**Delete tunnel (if needed):**
```powershell
C:\Cloudflared\cloudflared.exe tunnel delete alumni-tracer
```

---

Your Laravel app at `akndev.tech` should now be live! 🚀
