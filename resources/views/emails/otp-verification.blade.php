<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #7C2D3A 0%, #9C3D4D 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            color: #F5E6D3;
            margin: 10px 0 0;
            font-size: 14px;
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
            font-size: 16px;
            color: #555;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .otp-box {
            background: linear-gradient(135deg, #7C2D3A 0%, #9C3D4D 100%);
            border-radius: 10px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-label {
            color: #F5E6D3;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }
        .otp-code {
            font-size: 48px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .warning {
            background-color: #FFF3CD;
            border-left: 4px solid #FFB020;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning-text {
            font-size: 14px;
            color: #856404;
            margin: 0;
        }
        .info-box {
            background-color: #E8F4FD;
            border-left: 4px solid #0D6EFD;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-text {
            font-size: 14px;
            color: #055160;
            margin: 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer-text {
            font-size: 12px;
            color: #6c757d;
            margin: 0;
        }
        .footer-brand {
            color: #7C2D3A;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Email Verification</h1>
            <p>Alumni Tracer System</p>
        </div>
        
        <div class="content">
            <p class="greeting">Hello,</p>
            
            @if($purpose === 'registration')
            <p class="message">
                Thank you for registering with the Alumni Tracer System! To complete your registration, 
                please enter the verification code below:
            </p>
            @elseif($purpose === 'password_reset')
            <p class="message">
                We received a request to reset your password. Please use the verification code below 
                to proceed with your password reset:
            </p>
            @else
            <p class="message">
                Please use the verification code below to verify your email address:
            </p>
            @endif
            
            <div class="otp-box">
                <p class="otp-label">Your Verification Code</p>
                <p class="otp-code">{{ $otp }}</p>
            </div>
            
            <div class="warning">
                <p class="warning-text">
                    ⏰ This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.
                </p>
            </div>
            
            <div class="info-box">
                <p class="info-text">
                    📬 This verification was requested for: <strong>{{ $email }}</strong>
                </p>
            </div>
            
            <p class="message">
                If you did not request this verification code, you can safely ignore this email. 
                Someone may have entered your email address by mistake.
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                This is an automated message from <span class="footer-brand">Alumni Tracer System</span>.<br>
                Please do not reply to this email.
            </p>
            <p class="footer-text" style="margin-top: 10px;">
                © {{ date('Y') }} Alumni Tracer System. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
