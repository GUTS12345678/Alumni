# AI/ML Job Classification - Feasibility Analysis

## EARIST Alumni Tracer System

**Date:** February 3, 2026  
**Status:** Proposal/Planning

---

## 🤔 Question: Can We Use a Pretrained Model or AI for Job Classification?

**Short Answer:** YES, but it requires significant data preparation and training.

---

## 1. Current System vs AI-Powered System

### Current System (Manual):
```
Alumni → Fills Survey → Selects "Overqualified/Underqualified/Unfit" → Stored in DB
                              ↑
                    (Subjective self-assessment)
```

### AI-Powered System (Proposed):
```
Alumni → Enters Job Details → AI Analyzes → Suggests Classification → Alumni Confirms
                                   ↑
                    (Objective analysis based on data)
```

---

## 2. What AI/ML Can Do

### 2.1 Job-Education Alignment Classification

**Task:** Determine if a job matches the alumni's degree field

**Input Data Needed:**
```json
{
  "degree_program": "BS Computer Science",
  "job_title": "Software Engineer",
  "job_description": "Develop web applications using React...",
  "company_industry": "Technology"
}
```

**AI Output:**
```json
{
  "alignment_score": 0.92,
  "classification": "good_match",
  "confidence": 0.87,
  "reasoning": "Job requires programming skills taught in CS curriculum"
}
```

### 2.2 Overqualified/Underqualified Detection

**Input Data Needed:**
```json
{
  "alumni_degree_level": "Master's Degree",
  "alumni_degree_field": "Computer Science",
  "alumni_years_experience": 5,
  "job_title": "Data Entry Clerk",
  "job_required_education": "High School",
  "job_required_experience": 0
}
```

**AI Output:**
```json
{
  "qualification_match": "overqualified",
  "education_gap": +3,  // 3 levels above required
  "confidence": 0.94
}
```

---

## 3. What's Needed for Accurate AI Classification

### 3.1 Training Data Requirements

| Data Type | Minimum Required | Ideal Amount | Purpose |
|-----------|-----------------|--------------|---------|
| **Labeled job-degree pairs** | 5,000 | 50,000+ | Train alignment model |
| **Job descriptions** | 10,000 | 100,000+ | Learn job requirements |
| **Degree curriculums** | 50 | 500+ | Understand education content |
| **Verified classifications** | 2,000 | 20,000+ | Validate predictions |

### 3.2 Data Quality Requirements

**❌ Bad Training Data:**
```
Job Title: "Staff"
Degree: "Science"
Classification: "match"
```

**✅ Good Training Data:**
```
Job Title: "Junior Software Developer"
Job Description: "Develop backend APIs using Python/Django. Requirements: BS in CS or related field, 0-2 years experience"
Job Industry: "Technology - Software Development"
Required Education: "Bachelor's Degree"
Required Field: "Computer Science, Information Technology, or related"
Required Experience: "0-2 years"

Alumni Degree: "BS Computer Science"
Alumni Graduation Year: 2024
Alumni GPA: 3.5

Classification: "good_match"
Verified By: "Department Head"
```

### 3.3 Feature Engineering

**Features the AI needs to analyze:**

1. **Education Features:**
   - Degree level (1-8 scale: HS=1, PhD=8)
   - Degree field (encoded)
   - Specializations
   - Certifications
   - GPA/Academic performance

2. **Job Features:**
   - Job title (embedded/encoded)
   - Required education level
   - Required field of study
   - Required years of experience
   - Industry classification
   - Salary range (indicator of level)

3. **Match Features:**
   - Education level difference
   - Field similarity score
   - Experience gap
   - Skill overlap

---

## 4. AI/ML Model Options

### Option A: Rule-Based Expert System (Simplest)

**How It Works:**
```python
def classify_job_match(alumni, job):
    # Education level rules
    edu_diff = alumni.degree_level - job.required_education
    
    if edu_diff >= 2:
        return "overqualified"
    elif edu_diff <= -2:
        return "underqualified"
    
    # Field matching rules
    if alumni.degree_field in job.related_fields:
        return "good_match"
    else:
        return "unfit"
```

**Pros:**
- Simple to implement
- Transparent logic
- No training data needed
- Easy to modify rules

**Cons:**
- Limited flexibility
- Can't handle edge cases
- Requires manual rule creation

**Accuracy:** ~70-75%

---

### Option B: Pretrained NLP Model (Recommended)

**Models to Consider:**

| Model | Size | Accuracy | Cost |
|-------|------|----------|------|
| **BERT** | 110M params | High | Free |
| **RoBERTa** | 125M params | Higher | Free |
| **GPT-3.5/4** | Massive | Highest | Paid API |
| **Llama 2** | 7B-70B | High | Free |
| **Sentence-BERT** | 110M | Good for similarity | Free |

**Recommended: Fine-tuned BERT or Sentence-BERT**

**How It Works:**
```python
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')

# Encode degree program description
degree_embedding = model.encode("BS Computer Science - Programming, algorithms, databases, software engineering")

# Encode job description
job_embedding = model.encode("Software Engineer - Develop web apps using modern frameworks")

# Calculate similarity
similarity = util.cos_sim(degree_embedding, job_embedding)
# Output: 0.82 (high similarity = good match)
```

**Pros:**
- High accuracy
- Understands context
- Can generalize to new jobs
- Free to use

**Cons:**
- Requires fine-tuning
- Needs GPU for training
- Black box decisions

**Accuracy:** ~85-92%

---

### Option C: Custom Classification Model

**Architecture:**
```
Input Layer
    ↓
[Degree Embedding] + [Job Embedding] + [Numeric Features]
    ↓
Concatenation Layer
    ↓
Dense Layer (256 units)
    ↓
Dropout (0.3)
    ↓
Dense Layer (128 units)
    ↓
Output Layer (4 classes: overqualified, underqualified, unfit, good_match)
```

**Training Process:**
1. Collect labeled data (alumni-job pairs with classifications)
2. Preprocess text (tokenize, embed)
3. Train model on 80% data
4. Validate on 20% data
5. Fine-tune hyperparameters
6. Deploy

**Accuracy:** ~88-95% (with good data)

---

## 5. Implementation Roadmap

### Phase 1: Data Collection (2-4 weeks)

**Tasks:**
1. Add required fields to job/employment forms:
   - Job description (text)
   - Required education level
   - Required years of experience
   - Industry classification

2. Collect historical data:
   - Export existing alumni-job pairs
   - Manually classify a subset (500-1000 pairs)
   - Survey alumni to verify classifications

**Database Changes:**
```sql
ALTER TABLE employments ADD COLUMN job_description TEXT;
ALTER TABLE employments ADD COLUMN required_education_level ENUM('high_school','associate','bachelor','master','doctorate');
ALTER TABLE employments ADD COLUMN required_years_experience INT;
ALTER TABLE employments ADD COLUMN job_industry VARCHAR(100);
ALTER TABLE employments ADD COLUMN ai_classification VARCHAR(50);
ALTER TABLE employments ADD COLUMN ai_confidence DECIMAL(3,2);
ALTER TABLE employments ADD COLUMN ai_classified_at TIMESTAMP;
```

### Phase 2: Model Development (4-8 weeks)

**Tasks:**
1. Set up ML environment (Python, TensorFlow/PyTorch)
2. Preprocess and clean data
3. Train baseline model
4. Iterate and improve
5. Evaluate on test set

**Required Resources:**
- Python environment
- GPU (for training) - Google Colab free tier works
- ML libraries: scikit-learn, transformers, sentence-transformers

### Phase 3: Integration (2-4 weeks)

**Tasks:**
1. Create ML API endpoint (Flask/FastAPI)
2. Integrate with Laravel backend
3. Update frontend forms
4. Add suggestion UI

**Architecture:**
```
[Laravel Backend] → [ML API (Python)] → [BERT/Classification Model]
        ↓                  ↓
    Save result      Return prediction
```

### Phase 4: Deployment & Monitoring (Ongoing)

**Tasks:**
1. Deploy ML API (Docker container)
2. Monitor prediction accuracy
3. Collect feedback (alumni confirms/rejects)
4. Retrain model periodically

---

## 6. Accuracy Expectations

### With Current Data:
**~70-75% accuracy** (rule-based only)

### With Proper Training Data (5,000+ labeled pairs):
**~85-88% accuracy**

### With Large Dataset + Fine-tuning (50,000+ pairs):
**~90-95% accuracy**

### Factors Affecting Accuracy:

| Factor | Impact | How to Improve |
|--------|--------|----------------|
| **Data quality** | Very High | Clean, detailed job descriptions |
| **Data quantity** | High | More labeled examples |
| **Job description detail** | High | Require detailed descriptions |
| **Degree curriculum data** | Medium | Map courses to skills |
| **Industry standardization** | Medium | Use standard classifications |

---

## 7. Quick Win: Hybrid Approach

**Recommended: Start with Rule-Based + NLP Similarity**

### Implementation:

```php
// app/Services/JobClassificationService.php
class JobClassificationService
{
    public function classifyJobMatch(AlumniProfile $alumni, Employment $job): array
    {
        // Step 1: Rule-based education level check
        $educationScore = $this->calculateEducationMatch(
            $alumni->degree_level,
            $job->required_education_level
        );
        
        // Step 2: NLP similarity for field matching
        $fieldSimilarity = $this->calculateFieldSimilarity(
            $alumni->degree_program,
            $job->job_title . ' ' . $job->job_description
        );
        
        // Step 3: Combine scores
        $classification = $this->determineClassification(
            $educationScore,
            $fieldSimilarity
        );
        
        return [
            'classification' => $classification,
            'confidence' => $this->calculateConfidence($educationScore, $fieldSimilarity),
            'education_match' => $educationScore,
            'field_similarity' => $fieldSimilarity,
            'is_ai_suggested' => true,
        ];
    }
    
    private function calculateEducationMatch(int $alumniLevel, int $jobRequired): string
    {
        $diff = $alumniLevel - $jobRequired;
        
        if ($diff >= 2) return 'overqualified';
        if ($diff <= -2) return 'underqualified';
        return 'appropriate';
    }
    
    private function calculateFieldSimilarity(string $degree, string $jobText): float
    {
        // Call external NLP API or local model
        // Returns 0.0 to 1.0
        return $this->nlpService->getSimilarity($degree, $jobText);
    }
}
```

### Frontend Suggestion UI:

```tsx
// JobAlignmentSuggestion.tsx
const JobAlignmentSuggestion = ({ suggestion }) => {
  return (
    <div className="ai-suggestion-card">
      <Badge variant={suggestion.classification === 'good_match' ? 'success' : 'warning'}>
        AI Suggestion: {formatClassification(suggestion.classification)}
      </Badge>
      
      <p className="text-sm text-muted-foreground">
        Confidence: {(suggestion.confidence * 100).toFixed(0)}%
      </p>
      
      <div className="flex gap-2 mt-2">
        <Button onClick={() => acceptSuggestion(suggestion)}>
          ✓ Accept
        </Button>
        <Button variant="outline" onClick={() => rejectSuggestion()}>
          ✗ Choose Different
        </Button>
      </div>
    </div>
  );
};
```

---

## 8. Cost Analysis

### Option A: Rule-Based (Free)
- Development: 1-2 weeks
- Hosting: None (runs in PHP)
- Maintenance: Low

### Option B: Local ML Model (Low Cost)
- Development: 4-8 weeks
- Hosting: ~$20-50/month (small VPS with GPU)
- Maintenance: Medium

### Option C: API-Based (OpenAI/Claude)
- Development: 1-2 weeks
- API Costs: ~$0.01-0.10 per classification
- At 10,000 classifications/month: $100-1000/month
- Maintenance: Low

### Recommendation:
**Start with Rule-Based + Free Sentence-BERT** → Upgrade to custom model when data is sufficient

---

## 9. Summary

### What You Need for Accurate AI:

1. ✅ **Detailed job descriptions** (not just titles)
2. ✅ **Standardized education levels** (HS, Bachelor's, Master's, PhD)
3. ✅ **Industry classifications** (use standard codes)
4. ✅ **Labeled training data** (verified classifications)
5. ✅ **Feedback loop** (alumni confirms/rejects AI suggestion)

### Recommended Approach:

1. **Phase 1 (Now):** Add required data fields to forms
2. **Phase 2 (1-2 months):** Implement rule-based + similarity scoring
3. **Phase 3 (3-6 months):** Collect labeled data, train custom model
4. **Phase 4 (Ongoing):** Improve model with feedback

### Expected Timeline:
- Basic AI suggestions: 2-4 weeks
- Accurate AI classifications: 3-6 months
- Production-ready system: 6-12 months

---

## 10. Next Steps

Would you like me to:

1. **Add required fields** to the employment/job forms (job_description, required_education, etc.)?
2. **Implement rule-based classification** as a quick win?
3. **Create a Python ML service** for NLP similarity?
4. **Design the feedback UI** for AI suggestions?

Let me know which approach you'd like to start with!

---

*This document outlines the feasibility and requirements for AI-powered job classification.*
