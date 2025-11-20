<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Set Up Two-Factor Authentication</title>
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
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
            padding: 40px 30px;
            text-align: center;
            color: #ffffff;
        }
        .header-icon {
            width: 60px;
            height: 60px;
            margin: 0 auto 20px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #7f1d1d;
        }
        .qr-container {
            text-align: center;
            margin: 30px 0;
            padding: 30px;
            background-color: #f9fafb;
            border-radius: 8px;
            border: 2px dashed #e5e7eb;
        }
        .qr-code {
            max-width: 250px;
            height: auto;
            margin: 20px auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .secret-key-container {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .secret-key {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: 600;
            color: #92400e;
            text-align: center;
            letter-spacing: 2px;
            word-break: break-all;
        }
        .steps {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .steps h3 {
            color: #7f1d1d;
            margin-top: 0;
            font-size: 16px;
        }
        .steps ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        .steps li {
            margin: 10px 0;
            line-height: 1.5;
        }
        .app-links {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #eff6ff;
            border-radius: 8px;
        }
        .app-links h4 {
            color: #1e40af;
            margin-top: 0;
        }
        .app-links a {
            display: inline-block;
            margin: 10px;
            padding: 10px 20px;
            background-color: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
        }
        .app-links a:hover {
            background-color: #2563eb;
        }
        .warning {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning strong {
            color: #991b1b;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
        }
        .footer a {
            color: #7f1d1d;
            text-decoration: none;
        }
        .support {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-icon">🔐</div>
            <h1>Two-Factor Authentication Setup</h1>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">Hello {{ $userName }},</div>

            <p>Welcome to the Alumni Tracer System! For your security, we've enabled <strong>Two-Factor Authentication (2FA)</strong> on your account.</p>

            <p>Follow these simple steps to complete your setup:</p>

            <!-- Steps -->
            <div class="steps">
                <h3>📱 Setup Instructions</h3>
                <ol>
                    <li><strong>Download Google Authenticator</strong> app on your smartphone (available for iPhone and Android)</li>
                    <li><strong>Open the app</strong> and tap the <strong>"+"</strong> button</li>
                    <li><strong>Scan the QR code below</strong> with your phone's camera, OR manually enter the secret key</li>
                    <li><strong>Save the account</strong> in the app</li>
                    <li>When logging in, enter the <strong>6-digit code</strong> shown in the app</li>
                </ol>
            </div>

            <!-- QR Code -->
            <div class="qr-container">
                <h3 style="margin-top: 0; color: #374151;">Scan This QR Code</h3>
                <img src="{{ $qrCodeUrl }}" alt="QR Code" class="qr-code">
                <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
                    Scan this code with Google Authenticator to add your account
                </p>
            </div>

            <!-- Secret Key -->
            <div class="secret-key-container">
                <p style="margin-top: 0; font-weight: 600; color: #92400e;">⚠️ Manual Entry Option:</p>
                <p style="margin: 10px 0; font-size: 14px; color: #92400e;">If you can't scan the QR code, manually enter this secret key in Google Authenticator:</p>
                <div class="secret-key">{{ $secretKey }}</div>
                <p style="margin-bottom: 0; font-size: 13px; color: #92400e; margin-top: 10px;">
                    <strong>Keep this key secure!</strong> You can use it to restore access if you lose your phone.
                </p>
            </div>

            <!-- App Download Links -->
            <div class="app-links">
                <h4>Download Google Authenticator</h4>
                <a href="https://apps.apple.com/app/google-authenticator/id388497605" target="_blank">📱 iPhone / iOS</a>
                <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank">📱 Android</a>
            </div>

            <!-- Warning -->
            <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>You will need this app to log in every time</li>
                    <li>Save the secret key in a secure location (password manager, encrypted file)</li>
                    <li>Without access to Google Authenticator, you won't be able to log in</li>
                    <li>Contact your administrator if you lose access to your authenticator app</li>
                </ul>
            </div>

            <!-- Support Section -->
            <div class="support">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    Need help? Contact our support team at <a href="mailto:{{ config('mail.from.address') }}">{{ config('mail.from.address') }}</a>
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p style="margin: 0 0 10px 0;">
                <strong>{{ config('app.name') }}</strong>
            </p>
            <p style="margin: 0; font-size: 13px;">
                This is an automated email. Please do not reply to this message.
            </p>
            <p style="margin: 15px 0 0 0; font-size: 12px; color: #9ca3af;">
                © {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
