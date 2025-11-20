<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Code</title>
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
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
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
        .message {
            font-size: 16px;
            color: #555;
            line-height: 1.6;
            margin-bottom: 20px;
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
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer-text {
            font-size: 12px;
            color: #6c757d;
            margin: 5px 0;
        }
        .security-tips {
            background-color: #E8F4F8;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .security-tips h3 {
            color: #7C2D3A;
            margin-top: 0;
            font-size: 16px;
        }
        .security-tips ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .security-tips li {
            color: #555;
            font-size: 14px;
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Alumni Tracer System</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Hello {{ $userName }},</p>
            
            <p class="message">
                You have requested to log in using One-Time Password (OTP) authentication. 
                Please use the code below to complete your login:
            </p>
            
            <div class="otp-box">
                <div class="otp-label">Your OTP Code</div>
                <div class="otp-code">{{ $otp }}</div>
            </div>
            
            <p class="message">
                This code will expire in <strong>5 minutes</strong>. 
                Please enter it on the login page to access your account.
            </p>
            
            <div class="warning">
                <p class="warning-text">
                    ⚠️ <strong>Security Notice:</strong> Never share this code with anyone. 
                    Our team will never ask for your OTP code via email, phone, or any other means.
                </p>
            </div>
            
            <div class="security-tips">
                <h3>🛡️ Security Tips:</h3>
                <ul>
                    <li>This OTP is valid for only 5 minutes</li>
                    <li>Each OTP can only be used once</li>
                    <li>If you didn't request this code, please ignore this email</li>
                    <li>Consider changing your password if you suspect unauthorized access</li>
                    <li>Always log out from shared computers</li>
                </ul>
            </div>
            
            <p class="message">
                If you did not attempt to log in, please contact your system administrator immediately.
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>Alumni Tracer System</strong>
            </p>
            <p class="footer-text">
                This is an automated message. Please do not reply to this email.
            </p>
            <p class="footer-text">
                © {{ date('Y') }} Alumni Tracer System. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
