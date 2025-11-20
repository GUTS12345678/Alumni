<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Two-Factor Authentication Setup</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #7C2529 0%, #5a1b1e 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .message {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .qr-section {
            text-align: center;
            padding: 30px;
            background: #f9f9f9;
            border-radius: 8px;
            margin: 30px 0;
        }
        .qr-code {
            max-width: 250px;
            height: auto;
            margin: 20px auto;
            display: block;
        }
        .secret-key {
            background: #fff;
            border: 2px dashed #7C2529;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
        }
        .secret-key-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        .secret-key-value {
            font-size: 20px;
            font-weight: bold;
            color: #7C2529;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
        }
        .instructions {
            background: #e8f4f8;
            border-left: 4px solid #2196F3;
            padding: 20px;
            margin: 20px 0;
        }
        .instructions h3 {
            margin-top: 0;
            color: #1976D2;
        }
        .instructions ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .instructions li {
            margin: 8px 0;
            color: #555;
        }
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        .footer {
            background: #f9f9f9;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #eee;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #7C2529;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Two-Factor Authentication Setup</h1>
        </div>
        
        <div class="content">
            <div class="greeting">
                Hello, {{ $userName }}!
            </div>
            
            <div class="message">
                <p>Welcome to the Alumni Tracer System! To enhance the security of your account, we require all users to enable Two-Factor Authentication (2FA).</p>
                <p>This extra layer of security will protect your account from unauthorized access.</p>
            </div>

            <div class="qr-section">
                <h2 style="color: #7C2529; margin-top: 0;">Scan QR Code</h2>
                <p style="color: #666; margin-bottom: 20px;">Open Google Authenticator app and scan this QR code:</p>
                <img src="{{ $qrCodeUrl }}" alt="2FA QR Code" class="qr-code">
            </div>

            <div class="secret-key">
                <div class="secret-key-label">Manual Setup Key</div>
                <div class="secret-key-value">{{ $secretKey }}</div>
            </div>

            <div class="instructions">
                <h3>Setup Instructions:</h3>
                <ol>
                    <li><strong>Download Google Authenticator</strong> from your app store (iOS/Android)</li>
                    <li><strong>Open the app</strong> and tap the "+" icon</li>
                    <li><strong>Scan the QR code</strong> above, or enter the secret key manually</li>
                    <li><strong>Save the account</strong> - You'll see a 6-digit code that refreshes every 30 seconds</li>
                    <li><strong>Use this code</strong> when logging in after entering your password</li>
                </ol>
            </div>

            <div class="warning">
                <strong>⚠️ Important:</strong> Starting from your next login, you will be required to enter a verification code from Google Authenticator. Please set this up now to avoid being locked out of your account.
            </div>

            <div style="text-align: center;">
                <a href="{{ config('app.url') }}/login" class="button">Go to Login</a>
            </div>
        </div>

        <div class="footer">
            <p><strong>Alumni Tracer System</strong></p>
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>If you did not register for an account, please contact our support team immediately.</p>
        </div>
    </div>
</body>
</html>
