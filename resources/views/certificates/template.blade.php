<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $certificate->title }}</title>
    <style>
        @page {
            margin: 0;
        }
        
        body {
            font-family: 'DejaVu Sans', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }

        .certificate-container {
            width: 100%;
            min-height: 100vh;
            display: table;
        }

        .certificate-wrapper {
            display: table-cell;
            vertical-align: middle;
            padding: 30px;
        }

        .certificate {
            background: #ffffff;
            border-radius: 15px;
            padding: 50px;
            margin: 0 auto;
            max-width: 900px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
            position: relative;
            border: 3px solid #667eea;
        }

        .certificate::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            pointer-events: none;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .institution-name {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
            letter-spacing: 2px;
        }

        .certificate-title {
            font-size: 42px;
            font-weight: bold;
            color: #333;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 3px;
        }

        .ornament {
            color: #667eea;
            font-size: 24px;
            margin: 10px 0;
        }

        .body {
            text-align: center;
            margin: 30px 0;
        }

        .presented-to {
            font-size: 18px;
            color: #666;
            margin-bottom: 15px;
        }

        .recipient-name {
            font-size: 36px;
            font-weight: bold;
            color: #333;
            margin: 15px 0;
            font-style: italic;
            border-bottom: 2px solid #667eea;
            display: inline-block;
            padding-bottom: 5px;
        }

        .description {
            font-size: 16px;
            color: #666;
            max-width: 700px;
            margin: 25px auto;
            line-height: 1.6;
        }

        .certificate-type {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 15px;
        }

        .footer {
            display: table;
            width: 100%;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e0e0e0;
        }

        .footer-left,
        .footer-center,
        .footer-right {
            display: table-cell;
            text-align: center;
            width: 33.33%;
            vertical-align: bottom;
        }

        .signature-line {
            border-top: 1px solid #333;
            width: 150px;
            margin: 0 auto;
            padding-top: 5px;
        }

        .signature-name {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }

        .date-issued {
            font-size: 14px;
            color: #666;
        }

        .date-value {
            font-weight: bold;
            color: #333;
        }

        .certificate-number {
            font-size: 11px;
            color: #999;
            margin-top: 10px;
        }

        .seal {
            width: 80px;
            height: 80px;
            border: 3px solid #667eea;
            border-radius: 50%;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .seal-text {
            font-size: 10px;
            color: #667eea;
            text-transform: uppercase;
            text-align: center;
            font-weight: bold;
        }

        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(102, 126, 234, 0.05);
            font-weight: bold;
            pointer-events: none;
            z-index: 0;
        }
    </style>
</head>
<body>
    <div class="certificate-container">
        <div class="certificate-wrapper">
            <div class="certificate">
                <div class="watermark">CERTIFIED</div>
                
                <div class="header">
                    <div class="institution-name">{{ $institutionName }}</div>
                    <div class="ornament">✦ ✦ ✦</div>
                    <div class="certificate-title">Certificate</div>
                    <div class="certificate-type">{{ ucwords(str_replace('_', ' ', $certificate->type)) }}</div>
                </div>

                <div class="body">
                    <div class="presented-to">This is to certify that</div>
                    <div class="recipient-name">{{ $user->name }}</div>
                    <div class="description">{{ $certificate->description }}</div>
                </div>

                <div class="footer">
                    <div class="footer-left">
                        <div class="date-issued">
                            <div>Date Issued</div>
                            <div class="date-value">{{ $issuedDate }}</div>
                        </div>
                    </div>
                    <div class="footer-center">
                        <div class="seal">
                            <div class="seal-text">Official<br>Seal</div>
                        </div>
                    </div>
                    <div class="footer-right">
                        <div class="signature-line"></div>
                        <div class="signature-name">Authorized Signature</div>
                    </div>
                </div>

                <div style="text-align: center;">
                    <div class="certificate-number">
                        Certificate No: {{ $certificate->certificate_number }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
