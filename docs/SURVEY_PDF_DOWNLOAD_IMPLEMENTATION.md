# Survey PDF Download & Print Functionality

## Overview
Implemented PDF download and print functionality for completed survey responses in the Alumni Tracer System.

## Features Implemented

### 1. Backend API Endpoint
**File:** `app/Http/Controllers/Api/SurveyController.php`

#### New Method: `downloadResponsePDF($responseToken)`
- **Purpose:** Generate and download survey response as HTML/PDF
- **Authentication:** Required (Sanctum)
- **Authorization:** Users can only download their own responses
- **Response Format:** HTML document (can be saved as PDF by browser)

#### New Method: `generateResponseHTML($response)`
- **Purpose:** Generate formatted HTML document for survey response
- **Features:**
  - Professional styling with school colors (maroon/beige theme)
  - Response header with survey title and description
  - Response metadata (token, status, dates, time taken)
  - All questions and answers formatted clearly
  - Required questions marked with asterisk
  - Rating answers displayed prominently
  - Responsive design for printing
  - Footer with generation timestamp

### 2. API Route
**File:** `routes/api.php`

```php
Route::get('/survey-response/{responseToken}/download', [SurveyController::class, 'downloadResponsePDF']);
```

- **Endpoint:** `GET /api/v1/survey-response/{responseToken}/download`
- **Authentication:** Required
- **Parameters:** 
  - `responseToken` (path parameter)

### 3. Frontend Implementation
**File:** `resources/js/pages/Alumni/Surveys/SurveyHistory.tsx`

#### New Function: `handleDownloadPDF()`
- Fetches CSRF cookie for authentication
- Makes API request to download endpoint
- Creates blob from HTML content
- Triggers browser download with filename format:
  - `survey_response_{token}_{date}.html`

#### Modal Action Buttons
Added three action buttons to the response details modal:

1. **Print Button**
   - Icon: Printer
   - Action: Opens browser print dialog
   - Styling: Blue outline
   - Available: All responses

2. **Download Button**
   - Icon: Download
   - Action: Downloads response as HTML file
   - Styling: Green outline
   - Available: Completed responses only

3. **Close Button**
   - Action: Closes modal
   - Styling: Maroon solid background

## Technical Details

### HTML Document Structure
The generated HTML includes:

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Embedded CSS styles -->
    <style>
        /* Professional styling with maroon/beige theme */
        /* Print-friendly layout */
        /* Responsive design */
    </style>
</head>
<body>
    <div class="header">
        <!-- Survey title and description -->
    </div>
    
    <div class="info-section">
        <!-- Response metadata -->
        <!-- Status, dates, time taken -->
        <!-- Respondent email (if not anonymous) -->
    </div>
    
    <h2>Responses</h2>
    
    <div class="question-block">
        <!-- Each question with answer -->
        <!-- Highlighted answer boxes -->
        <!-- Rating display -->
    </div>
    
    <div class="footer">
        <!-- Generation timestamp -->
        <!-- System branding -->
    </div>
</body>
</html>
```

### Styling Features
- **Color Scheme:** Maroon (#7f1d1d) and beige accents
- **Typography:** Arial font, clear hierarchy
- **Layout:** 800px max-width, centered
- **Answers:** Yellow background with orange left border
- **Sections:** Gray background with maroon left border
- **Print-friendly:** Clean layout, appropriate margins

### Security Features
1. **Authentication Required:** Only logged-in users can download
2. **Authorization Check:** Users can only download their own responses
3. **CSRF Protection:** Token required for all requests
4. **Sanitization:** All user input is HTML-escaped using `htmlspecialchars()`

## Usage

### For Alumni Users
1. Navigate to "Survey History" page
2. Click "View Details" on any completed survey
3. In the modal, click:
   - **"Print"** to print the response
   - **"Download"** to save as HTML file
4. The HTML file can be:
   - Opened in any browser
   - Printed to PDF using browser's Print dialog
   - Saved as PDF using browser's "Save as PDF" option

### File Naming Convention
Downloads use the format:
```
survey_response_{token}_{YYYY-MM-DD}.html
```

Example:
```
survey_response_loWN70Ks2KGyWGp9R2xDHxGtsJkBrFl6uMb7bDS_2025-10-16.html
```

## Future Enhancements

### Phase 1 (Current)
- ✅ HTML download
- ✅ Print functionality
- ✅ Professional styling
- ✅ Security and authorization

### Phase 2 (Recommended)
- [ ] Install `dompdf` package for true PDF generation
- [ ] Add PDF generation option alongside HTML
- [ ] Add batch download for multiple responses
- [ ] Add email PDF functionality

### Phase 3 (Advanced)
- [ ] Add charts/graphs to PDF
- [ ] Add response analytics in PDF
- [ ] Add company logo/branding
- [ ] Add digital signature option

## Installation Notes

### Current Setup (No Additional Dependencies)
The current implementation uses HTML output which works immediately without any additional setup.

### For True PDF Generation (Optional)
If you want to generate actual PDF files instead of HTML:

```bash
composer require barryvdh/laravel-dompdf
```

Then update the controller to use Dompdf:
```php
use Barryvdh\DomPDF\Facade\Pdf;

public function downloadResponsePDF($responseToken)
{
    // ... existing code ...
    
    $html = $this->generateResponseHTML($response);
    $pdf = Pdf::loadHTML($html);
    
    return $pdf->download($filename);
}
```

## Testing Checklist

### Backend Testing
- [x] Endpoint responds correctly
- [x] Authentication is enforced
- [x] Authorization checks work
- [x] HTML is generated correctly
- [x] All data is sanitized

### Frontend Testing
- [x] Download button appears on completed surveys
- [x] Download triggers correctly
- [x] File downloads with correct name
- [x] Print button opens print dialog
- [x] Modal buttons are styled correctly

### User Experience Testing
- [ ] Test on different browsers (Chrome, Firefox, Edge)
- [ ] Test printing to PDF
- [ ] Test with various survey types
- [ ] Test with different answer types (text, rating, etc.)
- [ ] Test with anonymous surveys

## API Documentation

### Download Survey Response
```
GET /api/v1/survey-response/{responseToken}/download
```

**Headers:**
```
Accept: text/html
X-Requested-With: XMLHttpRequest
Authorization: Bearer {token}
```

**Response:**
- **Success (200):** HTML document
- **Not Found (404):** Survey response not found
- **Unauthorized (403):** Not the owner of this response

**Example Response:**
```html
<!DOCTYPE html>
<html>
...
</html>
```

## Conclusion

The PDF download functionality is now fully operational. Users can download their survey responses as HTML files which can be easily converted to PDF using any modern browser's print-to-PDF feature. The implementation prioritizes security, user experience, and professional presentation.
