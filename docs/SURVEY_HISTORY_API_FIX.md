# Survey History API Fix

## Date: October 16, 2025

---

## Issue: Survey History Page Showing Blank/White Screen

**Symptom:**
- Survey History page at `/alumni/surveys/history` displays blank white space
- React error in console about reading properties of undefined
- API call to `/api/v1/my-responses` may be working but returning wrong data structure

---

## Root Cause

The **backend API response structure** did not match what the **frontend TypeScript interfaces** expected.

### Frontend Expected (SurveyHistory.tsx):
```typescript
interface SurveyResponse {
    id: number;
    response_token: string;
    respondent_email: string;
    status: 'draft' | 'completed';
    started_at: string;
    completed_at: string | null;
    time_taken_minutes: number | null;  // ← Expected
    survey: {
        id: number;
        title: string;
        description: string;           // ← Expected
        type: string;
        is_anonymous: boolean;         // ← Expected
    };
    answers: SurveyAnswer[];           // ← Expected with specific structure
    total_questions: number;
    answered_questions: number;
    completion_percentage: number;
}

interface SurveyAnswer {
    id: number;
    survey_question_id: number;
    question: {                        // ← Expected nested object
        id: number;
        question_text: string;
        question_type: string;
        is_required: boolean;
        order: number;
    };
    answer_text: string | null;
    answer_value: number | null;
}
```

### Backend Was Returning (OLD):
```php
[
    'id' => $response->id,
    'survey' => [
        'id' => $response->survey->id,
        'title' => $response->survey->title,
        'type' => $response->survey->type,
        // ❌ Missing: description, is_anonymous
    ],
    'response_token' => $response->response_token,
    'status' => $response->status,
    'time_taken' => $response->time_taken,  // ❌ Wrong: should be time_taken_minutes
    // ❌ Missing: answers array with proper structure
    // ❌ Missing: respondent_email
]
```

---

## Solution

Updated `app/Http/Controllers/Api/SurveyController.php` → `myResponses()` method to:

### 1. Calculate Time Taken in Minutes
```php
$timeTakenMinutes = null;
if ($response->completed_at && $response->started_at) {
    $start = \Carbon\Carbon::parse($response->started_at);
    $end = \Carbon\Carbon::parse($response->completed_at);
    $timeTakenMinutes = (int) $start->diffInMinutes($end);
}
```

### 2. Map Answers with Proper Question Structure
```php
$answersData = $response->answers->map(function ($answer) {
    return [
        'id' => $answer->id,
        'survey_question_id' => $answer->survey_question_id,
        'question' => [                           // ← Nested question object
            'id' => $answer->surveyQuestion->id,
            'question_text' => $answer->surveyQuestion->question_text,
            'question_type' => $answer->surveyQuestion->question_type,
            'is_required' => $answer->surveyQuestion->is_required,
            'order' => $answer->surveyQuestion->order,
        ],
        'answer_text' => $answer->answer_text,
        'answer_value' => $answer->answer_value,
    ];
});
```

### 3. Include All Required Survey Fields
```php
'survey' => [
    'id' => $response->survey->id,
    'title' => $response->survey->title,
    'description' => $response->survey->description,  // ← Added
    'type' => $response->survey->type,
    'is_anonymous' => $response->survey->is_anonymous, // ← Added
],
```

### 4. Return Complete Response Structure
```php
return [
    'id' => $response->id,
    'response_token' => $response->response_token,
    'respondent_email' => $response->respondent_email,  // ← Added
    'status' => $response->status,
    'started_at' => $response->started_at,
    'completed_at' => $response->completed_at,
    'time_taken_minutes' => $timeTakenMinutes,          // ← Fixed name
    'survey' => [ /* full survey object */ ],
    'answers' => $answersData,                          // ← Proper structure
    'total_questions' => $response->survey->questions()->count(),
    'answered_questions' => $response->answers->count(),
    'completion_percentage' => /* calculated */,
];
```

---

## Files Modified

**File:** `app/Http/Controllers/Api/SurveyController.php`
- Method: `myResponses()` (lines ~595-670)
- Changes:
  - Added time calculation in minutes using Carbon
  - Added proper answer mapping with nested question structure
  - Added missing survey fields (description, is_anonymous)
  - Added respondent_email to response
  - Fixed field name: `time_taken` → `time_taken_minutes`
  - Added dynamic question and answer counts
  - Added completion percentage calculation

---

## Testing

After the fix:

1. **Clear Laravel cache:**
   ```bash
   php artisan optimize:clear
   ```

2. **Refresh browser** (hard refresh: `Ctrl + Shift + R`)

3. **Navigate to Survey History:**
   - Go to `/alumni/surveys/history`
   - Should now display survey responses (if any exist)
   - Or show "No Survey History Yet" message if empty

4. **Verify API Response:**
   ```bash
   # Test API directly
   curl -X GET http://localhost:8000/api/v1/my-responses \
     -H "Accept: application/json" \
     -H "Cookie: your_session_cookie"
   ```

---

## Expected Behavior Now

### With Survey Responses:
- ✅ Page loads without errors
- ✅ Stats cards show counts (Total, Completed, Drafts)
- ✅ Response cards display with:
  - Survey title and description
  - Status badge (Completed/Draft)
  - Type badge (Registration, Feedback, etc.)
  - Question counts (answered/total)
  - Time taken (formatted as "5 min" or "1h 23m")
  - Started and completed dates
  - Action buttons (View Details, Download PDF, Continue)
- ✅ Filter buttons work (All, Completed, Drafts)
- ✅ "View Details" opens modal with all Q&A
- ✅ Answers display properly (text or rating)

### Without Survey Responses:
- ✅ Page loads without errors
- ✅ Shows "No Survey History Yet" message
- ✅ Stats show 0 for all counts
- ✅ No React errors in console

---

## Relationship Verification

The fix relies on these Eloquent relationships:

```php
// SurveyResponse.php
public function survey() {
    return $this->belongsTo(Survey::class);
}

public function answers() {
    return $this->hasMany(SurveyAnswer::class);
}

// SurveyAnswer.php
public function surveyQuestion() {
    return $this->belongsTo(SurveyQuestion::class);
}

public function response() {
    return $this->belongsTo(SurveyResponse::class);
}
```

All relationships are correctly defined ✅

---

## API Endpoint

**Endpoint:** `GET /api/v1/my-responses`  
**Authentication:** Required (Sanctum session)  
**Middleware:** `auth:sanctum`  

**Response Structure:**
```json
{
    "success": true,
    "data": {
        "responses": [
            {
                "id": 1,
                "response_token": "abc123xyz",
                "respondent_email": "alumni@example.com",
                "status": "completed",
                "started_at": "2025-10-03 10:00:00",
                "completed_at": "2025-10-03 10:25:00",
                "time_taken_minutes": 25,
                "survey": {
                    "id": 1,
                    "title": "Alumni Registration & Initial Survey",
                    "description": "Welcome survey for new alumni",
                    "type": "registration",
                    "is_anonymous": false
                },
                "answers": [
                    {
                        "id": 1,
                        "survey_question_id": 1,
                        "question": {
                            "id": 1,
                            "question_text": "What is your current employment status?",
                            "question_type": "single_choice",
                            "is_required": true,
                            "order": 1
                        },
                        "answer_text": "Employed (Full-Time)",
                        "answer_value": null
                    }
                ],
                "total_questions": 22,
                "answered_questions": 22,
                "completion_percentage": 100
            }
        ],
        "stats": {
            "total": 1,
            "completed": 1,
            "draft": 0
        }
    }
}
```

---

## Prevention

To avoid similar issues in the future:

1. **Use TypeScript interfaces** to define expected API structure
2. **Match backend response** to frontend TypeScript interfaces exactly
3. **Test API responses** before implementing frontend
4. **Use API mocks** during development
5. **Add integration tests** for API endpoints
6. **Document API contracts** in separate API docs

---

## Related Files

- **Backend:** `app/Http/Controllers/Api/SurveyController.php`
- **Frontend:** `resources/js/pages/Alumni/Surveys/SurveyHistory.tsx`
- **Routes:** `routes/api.php` (line 33: GET `/my-responses`)
- **Models:** 
  - `app/Models/SurveyResponse.php`
  - `app/Models/SurveyAnswer.php`
  - `app/Models/Survey.php`
  - `app/Models/SurveyQuestion.php`

---

**Status:** Fixed ✅  
**Last Updated:** October 16, 2025, 4:02 PM  
**Next:** Test with actual survey response data
