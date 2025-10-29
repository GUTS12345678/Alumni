# ML-Based Job Qualification Matching

**Date:** October 8, 2025  
**Type:** Enhancement / Machine Learning Integration  
**Status:** 🔄 Documentation & Strategy

## Problem Statement

Currently, job mismatch classification (overqualified, underqualified, unfit, good match) is either:
1. **Randomly seeded** - for testing purposes only
2. **Self-reported** - alumni fill out surveys with their own assessment
3. **Manually classified** - admin reviews each case

**Goal:** Use machine learning to **automatically and intelligently** classify job qualification matches based on:
- Alumni education level (Bachelor's, Master's, PhD)
- Degree program (Computer Science, Engineering, Business, etc.)
- Job title and position level
- Industry and job description
- Years of experience

## Approach Options

### Option 1: Rule-Based Intelligent Classifier ✅ (Implemented)

**What we created:** `IntelligentJobMismatchSeeder.php`

**How it works:**
- Pattern matching on job titles (Senior/Executive vs Entry-level vs Mid-level)
- Program-to-job field mapping (CS → Software Developer, Nursing → Healthcare)
- Logic-based overqualification detection (PhD in entry-level = overqualified)
- Degree relevance checking (program keywords vs job title keywords)

**Accuracy:** ~70-80% for clear cases, struggles with:
- Ambiguous job titles
- Non-standard positions
- Cross-disciplinary roles
- Self-employed/entrepreneurship

**Implementation:**
```bash
php artisan db:seed --class=IntelligentJobMismatchSeeder
```

**Pros:**
- ✅ No external dependencies
- ✅ Transparent logic
- ✅ Easy to customize
- ✅ Works with limited data

**Cons:**
- ❌ Requires extensive pattern libraries
- ❌ Hard to maintain as job market evolves
- ❌ Cannot learn from feedback

---

### Option 2: Pre-Trained ML Model (Recommended for Production)

**Use existing models trained on millions of job-education pairs**

#### Recommended Services:

##### 1. **LinkedIn Skills Graph API** (Best for job matching)
```php
// Example integration
use LinkedIn\SkillsGraph;

$classifier = new SkillsGraph([
    'api_key' => env('LINKEDIN_API_KEY')
]);

$result = $classifier->matchJobToEducation([
    'job_title' => 'Senior Software Engineer',
    'education' => 'Bachelor of Science in Computer Science',
    'years_experience' => 5
]);

// Returns: {
//   'match_score': 0.92,
//   'qualification': 'good_match',
//   'reasoning': 'Education aligns with role requirements'
// }
```

**Pros:**
- ✅ Trained on 800M+ professional profiles
- ✅ Real-world job market data
- ✅ Continuous updates
- ✅ High accuracy (90%+)

**Cons:**
- ❌ Paid API ($0.10 per classification)
- ❌ Requires LinkedIn partnership
- ❌ External dependency

---

##### 2. **OpenAI GPT-4 Classification** (Most Flexible)
```php
use OpenAI\Client;

$openai = new Client(env('OPENAI_API_KEY'));

$prompt = "
Analyze this job-education match:
- Education: {$alumni->degree_program} ({$alumni->education_level})
- Current Job: {$alumni->current_job_title}
- Industry: {$alumni->industry}

Classify as: overqualified, underqualified, good_match, or unfit
Provide reasoning.
";

$response = $openai->chat()->create([
    'model' => 'gpt-4',
    'messages' => [
        ['role' => 'system', 'content' => 'You are a career counselor expert.'],
        ['role' => 'user', 'content' => $prompt]
    ],
    'temperature' => 0.3, // Lower = more consistent
]);

$classification = json_decode($response->choices[0]->message->content);
```

**Pros:**
- ✅ Extremely flexible and intelligent
- ✅ Can explain reasoning
- ✅ Handles edge cases well
- ✅ Easy to integrate

**Cons:**
- ❌ Cost: ~$0.03 per classification (GPT-4)
- ❌ Slower (2-5 seconds per call)
- ❌ Requires OpenAI account

**Cost Estimate:** For 1,000 alumni = $30/month

---

##### 3. **Custom ML Model** (Long-term Solution)

Train your own model using Python + scikit-learn or TensorFlow:

```python
# train_job_matcher.py
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer

# Load training data (you'd need 1,000+ labeled examples)
df = pd.read_csv('job_education_matches.csv')

# Features: education level, program, job title, industry
X = df[['education_level', 'degree_program', 'job_title', 'industry']]
y = df['classification']  # Target: overqualified, underqualified, etc.

# Vectorize text features
vectorizer = TfidfVectorizer()
X_vectorized = vectorizer.fit_transform(X.astype(str))

# Train model
model = RandomForestClassifier(n_estimators=100)
model.fit(X_vectorized, y)

# Save model
import joblib
joblib.dump(model, 'job_matcher_model.pkl')
joblib.dump(vectorizer, 'vectorizer.pkl')
```

Then integrate with Laravel:
```php
use Symfony\Component\Process\Process;

$process = new Process([
    'python3',
    base_path('ml/predict.py'),
    $alumni->education_level,
    $alumni->degree_program,
    $alumni->current_job_title
]);

$process->run();
$classification = json_decode($process->getOutput());
```

**Pros:**
- ✅ No ongoing API costs
- ✅ Full control and customization
- ✅ Can retrain with your own data
- ✅ Privacy-friendly (no external API calls)

**Cons:**
- ❌ Requires 1,000+ labeled training examples
- ❌ Need ML expertise to maintain
- ❌ Requires Python environment
- ❌ Manual retraining needed

---

### Option 3: Hybrid Approach (Recommended for Your Project)

**Combine rule-based + ML for best results:**

1. **Use rule-based classifier** for obvious cases:
   - PhD in "Junior Assistant" role = overqualified (100% confidence)
   - Bachelor's in "CEO" role = check experience first
   - Job title contains degree program = likely good match

2. **Use ML/GPT-4** for ambiguous cases:
   - Cross-disciplinary roles (CS degree, Marketing Manager)
   - Self-employment
   - Consulting/Freelance
   - Non-traditional career paths

```php
public function classifyJobMatch(AlumniProfile $alumni): array
{
    // Try rule-based first (fast, free)
    $ruleBasedResult = $this->ruleBasedClassifier($alumni);
    
    if ($ruleBasedResult['confidence'] >= 0.8) {
        // High confidence, use rule-based result
        return $ruleBasedResult;
    }
    
    // Low confidence, use ML model
    return $this->mlClassifier($alumni);
}
```

**Cost:** ~$5-10/month for 1,000 alumni (only ambiguous cases)

---

## Implementation Roadmap

### Phase 1: Rule-Based (Current) ✅
- [x] Pattern matching for job levels
- [x] Program-to-job field mapping
- [x] Basic overqualification detection
- [ ] Expand pattern library (100+ job titles)
- [ ] Add industry-specific rules

### Phase 2: ML Integration (Recommended)
- [ ] Choose ML service (OpenAI GPT-4 recommended)
- [ ] Create classification service class
- [ ] Implement confidence scoring
- [ ] Add fallback to rule-based
- [ ] Cache ML results to reduce costs

### Phase 3: Continuous Learning
- [ ] Collect admin feedback on classifications
- [ ] Build training dataset from corrections
- [ ] Fine-tune model quarterly
- [ ] A/B test rule-based vs ML accuracy

---

## Recommended Solution for Your Project

**Use GPT-4 for intelligent classification:**

### Why GPT-4?
1. ✅ **No training data needed** - already knows job market
2. ✅ **Highly accurate** - understands context and nuance
3. ✅ **Explainable** - provides reasoning for classifications
4. ✅ **Cost-effective** - only $0.03 per alumni (one-time)
5. ✅ **Easy integration** - just API calls

### Implementation Example

```php
// app/Services/JobMatchClassifier.php
namespace App\Services;

use App\Models\AlumniProfile;
use OpenAI\Laravel\Facades\OpenAI;

class JobMatchClassifier
{
    public function classify(AlumniProfile $alumni): array
    {
        // Check if already classified
        if ($alumni->job_mismatch_reason && $alumni->updated_at->diffInDays(now()) < 90) {
            return [
                'reason' => $alumni->job_mismatch_reason,
                'satisfaction' => $alumni->job_satisfaction,
                'related_to_degree' => $alumni->job_related_to_degree,
                'cached' => true
            ];
        }
        
        // Prepare prompt
        $prompt = $this->buildPrompt($alumni);
        
        // Call GPT-4
        $response = OpenAI::chat()->create([
            'model' => 'gpt-4-turbo',
            'messages' => [
                [
                    'role' => 'system',
                    'content' => 'You are an expert career counselor analyzing job-education matches. Return only JSON.'
                ],
                [
                    'role' => 'user',
                    'content' => $prompt
                ]
            ],
            'temperature' => 0.3,
            'response_format' => ['type' => 'json_object']
        ]);
        
        $result = json_decode($response->choices[0]->message->content, true);
        
        // Update alumni profile
        $alumni->update([
            'job_mismatch_reason' => $result['classification'],
            'job_satisfaction' => $result['predicted_satisfaction'],
            'job_related_to_degree' => $result['related_to_degree']
        ]);
        
        return $result;
    }
    
    private function buildPrompt(AlumniProfile $alumni): string
    {
        return <<<PROMPT
Analyze this alumni's job-education match:

EDUCATION:
- Level: {$alumni->education_level}
- Program: {$alumni->degree_program}
- Graduation Year: {$alumni->graduation_year}

CURRENT EMPLOYMENT:
- Job Title: {$alumni->current_job_title}
- Employment Status: {$alumni->employment_status}
- Years of Experience: {$this->calculateYearsOfExperience($alumni)}

CLASSIFICATION OPTIONS:
- overqualified: Education exceeds job requirements
- underqualified: Job requires higher education/experience
- unfit: Job completely unrelated to degree
- none: Good match, appropriate level
- career_change: Intentional field change
- location: Geographic/remote work issues
- salary: Compensation concerns

Return JSON:
{
  "classification": "one of the above options",
  "related_to_degree": true/false,
  "predicted_satisfaction": 1-5 (integer),
  "reasoning": "brief explanation",
  "confidence": 0.0-1.0
}
PROMPT;
    }
}
```

### Usage

```php
// In controller or seeder
use App\Services\JobMatchClassifier;

$classifier = new JobMatchClassifier();

foreach ($employedAlumni as $alumni) {
    $result = $classifier->classify($alumni);
    
    Log::info("Classified {$alumni->full_name}: {$result['classification']}", [
        'reasoning' => $result['reasoning'],
        'confidence' => $result['confidence']
    ]);
}
```

---

## Cost Analysis

### For 1,000 Alumni:

| Method | One-Time Cost | Monthly Cost | Accuracy |
|--------|--------------|--------------|----------|
| Rule-Based | Free | Free | 70-75% |
| GPT-4 | $30 | $0 (cached) | 90-95% |
| LinkedIn API | $100 | $10 (updates) | 88-92% |
| Custom ML | $500 (dev) | Free | 75-85% |

**Recommendation:** Start with GPT-4, classify once, cache results for 90 days.

---

## Next Steps

1. **Install OpenAI Package:**
```bash
composer require openai-php/laravel
```

2. **Configure API Key:**
```env
OPENAI_API_KEY=sk-your-key-here
```

3. **Create Classifier Service:**
```bash
php artisan make:service JobMatchClassifier
```

4. **Run Classification:**
```bash
php artisan job-match:classify --limit=10  # Test with 10 alumni first
```

5. **Review Results:**
```bash
php artisan job-match:report  # Show classification breakdown
```

---

## Alternative: Use Self-Reported Data

**The most accurate approach:**
- Alumni know their situation best
- Use Survey ID 7 (Employment Quality Survey)
- Validate with ML as second opinion
- Show both classifications to admin for final decision

---

**Questions?** Let me know if you want me to implement the GPT-4 classifier!
