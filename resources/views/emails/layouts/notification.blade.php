<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>@yield('title', config('app.name'))</title>
    <style>
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        
        /* Base styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }
        
        .email-wrapper {
            width: 100%;
            background-color: #f5f5f5;
            padding: 20px 0;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* Header */
        .email-header {
            background: linear-gradient(135deg, #800000 0%, #5c0000 100%);
            padding: 30px 40px;
            text-align: center;
        }
        
        .email-header h1 {
            color: #ffffff;
            font-size: 24px;
            margin: 0;
            font-weight: 600;
        }
        
        .email-header .subtitle {
            color: rgba(255, 255, 255, 0.85);
            font-size: 14px;
            margin-top: 8px;
        }
        
        /* Body */
        .email-body {
            padding: 40px;
        }
        
        .email-body h2 {
            color: #800000;
            font-size: 22px;
            margin: 0 0 20px 0;
            font-weight: 600;
        }
        
        .email-body p {
            color: #333333;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 16px 0;
        }
        
        .email-body .content {
            color: #444444;
            font-size: 15px;
            line-height: 1.7;
            margin: 20px 0;
            padding: 20px;
            background-color: #f9f9f9;
            border-left: 4px solid #800000;
            border-radius: 0 4px 4px 0;
        }
        
        /* Button */
        .button-wrapper {
            text-align: center;
            margin: 30px 0;
        }
        
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #800000 0%, #a00000 100%);
            color: #ffffff !important;
            text-decoration: none;
            font-size: 16px;
            font-weight: 600;
            border-radius: 6px;
            transition: all 0.3s ease;
        }
        
        .button:hover {
            background: linear-gradient(135deg, #600000 0%, #800000 100%);
        }
        
        .button-secondary {
            background: #f5f5f5;
            color: #800000 !important;
            border: 2px solid #800000;
        }
        
        /* Info box */
        .info-box {
            background-color: #fff8e1;
            border: 1px solid #ffc107;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
        }
        
        .info-box.success {
            background-color: #e8f5e9;
            border-color: #4caf50;
        }
        
        .info-box.info {
            background-color: #e3f2fd;
            border-color: #2196f3;
        }
        
        /* Meta info */
        .meta-info {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin: 20px 0;
            padding: 16px;
            background-color: #f5f5f5;
            border-radius: 6px;
        }
        
        .meta-item {
            flex: 1;
            min-width: 120px;
        }
        
        .meta-item .label {
            font-size: 12px;
            color: #666666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        
        .meta-item .value {
            font-size: 14px;
            color: #333333;
            font-weight: 600;
        }
        
        /* Footer */
        .email-footer {
            background-color: #f5f5f5;
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #e0e0e0;
        }
        
        .email-footer p {
            color: #666666;
            font-size: 13px;
            margin: 0 0 8px 0;
            line-height: 1.5;
        }
        
        .email-footer a {
            color: #800000;
            text-decoration: none;
        }
        
        .email-footer .unsubscribe {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e0e0e0;
        }
        
        .email-footer .unsubscribe a {
            color: #999999;
            font-size: 12px;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                margin: 0 !important;
                border-radius: 0 !important;
            }
            
            .email-header, .email-body, .email-footer {
                padding: 20px !important;
            }
            
            .email-header h1 {
                font-size: 20px !important;
            }
            
            .email-body h2 {
                font-size: 18px !important;
            }
            
            .button {
                display: block !important;
                width: 100% !important;
                text-align: center !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
                <td align="center">
                    <div class="email-container">
                        <!-- Header -->
                        <div class="email-header">
                            <h1>{{ config('app.name', 'Alumni Tracer System') }}</h1>
                            <p class="subtitle">@yield('header-subtitle', 'Connecting Alumni, Building Futures')</p>
                        </div>
                        
                        <!-- Body -->
                        <div class="email-body">
                            @yield('content')
                        </div>
                        
                        <!-- Footer -->
                        <div class="email-footer">
                            <p>
                                <strong>{{ config('app.name', 'Alumni Tracer System') }}</strong>
                            </p>
                            <p>
                                This email was sent to <strong>{{ $recipientEmail ?? 'you' }}</strong>
                            </p>
                            <p>
                                <a href="{{ config('app.url') }}">Visit our website</a> | 
                                <a href="{{ config('app.url') }}/alumni/settings">Manage preferences</a>
                            </p>
                            
                            @if(isset($unsubscribeUrl))
                            <div class="unsubscribe">
                                <a href="{{ $unsubscribeUrl }}">Unsubscribe from these emails</a>
                            </div>
                            @endif
                            
                            <p style="margin-top: 16px; font-size: 11px; color: #999999;">
                                © {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
                            </p>
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
