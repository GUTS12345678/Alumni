<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\User;

class JobMismatchSurveySeeder extends Seeder
{
    /**
     * Create a comprehensive survey for collecting job mismatch and satisfaction data
     */
    public function run(): void
    {
        // Get admin user for creator
        $admin = User::where('role', 'admin')->first();
        
        if (!$admin) {
            $this->command->error('No admin user found. Please create an admin user first.');
            return;
        }

        // Create the survey
        $survey = Survey::create([
            'title' => 'Employment Quality & Job Satisfaction Survey',
            'description' => 'Help us understand how well your education prepared you for your career and your current job satisfaction.',
            'instructions' => 'Please answer the following questions about your current employment. This information helps us improve our programs and better prepare future graduates.',
            'type' => 'follow_up',
            'status' => 'active',
            'start_date' => now(),
            'end_date' => now()->addMonths(6),
            'is_anonymous' => false,
            'allow_multiple_responses' => false,
            'require_authentication' => true,
            'is_registration_survey' => false,
            'send_reminder_emails' => true,
            'reminder_interval_days' => 7,
            'created_by' => $admin->id,
        ]);

        // Question 1: Current Employment Status
        SurveyQuestion::create([
            'survey_id' => $survey->id,
            'question_text' => 'What is your current employment status?',
            'description' => 'Please select the option that best describes your current situation',
            'question_type' => 'single_choice',
            'options' => [
                'Employed (Full-Time)',
                'Employed (Part-Time)',
                'Self-Employed',
                'Unemployed (Seeking Employment)',
                'Unemployed (Not Seeking)',
                'Continuing Education',
                'Military Service',
                'Other'
            ],
            'is_required' => true,
            'order' => 1,
        ]);

        // Question 2: Current Job Title
        SurveyQuestion::create([
            'survey_id' => $survey->id,
            'question_text' => 'What is your current job title?',
            'description' => 'Enter your official job title or position',
            'question_type' => 'text',
            'is_required' => false,
            'order' => 2,
            'conditional_logic' => [
                'show_if' => [
                    'question' => 1,
                    'answers' => ['Employed (Full-Time)', 'Employed (Part-Time)', 'Self-Employed']
                ]
            ],
        ]);

        // Question 3: Current Employer
        SurveyQuestion::create([
            'survey_id' => $survey->id,
            'question_text' => 'What is the name of your current employer/company?',
            'description' => 'Enter the company or organization name',
            'question_type' => 'text',
            'is_required' => false,
            'order' => 3,
            'conditional_logic' => [
                'show_if' => [
                    'question' => 1,
                    'answers' => ['Employed (Full-Time)', 'Employed (Part-Time)', 'Self-Employed']
                ]
            ],
        ]);

        // Question 4: Job Related to Degree
        SurveyQuestion::create([
            'survey_id' => $survey->id,
            'question_text' => 'Is your current job related to your degree/field of study?',
            'description' => 'Please indicate if your job aligns with your education',
            'question_type' => 'single_choice',
            'options' => ['Yes', 'No'],
            'is_required' => true,
            'order' => 4,
            'conditional_logic' => [
                'show_if' => [
                    'question' => 1,
                    'answers' => ['Employed (Full-Time)', 'Employed (Part-Time)', 'Self-Employed']
                ]
            ],
        ]);

        // Question 5: Job Qualification Match
        SurveyQuestion::create([
            'survey_id' => $survey->id,
            'question_text' => 'How well does your job match your educational qualifications?',
            'description' => 'Select the option that best describes your situation',
            'question_type' => 'single_choice',
            'options' => [
                'Perfect match - My job requires exactly my level of education',
                'Overqualified - My job requires less education than I have',
                'Underqualified - My job requires more education/training than I have',
                'Unfit - My job is not in my field of study at all',
                'Career change by choice',
                'Location constraints affected my job choice',
                'Salary was the primary factor',
                'Other reasons',
            ],
            'is_required' => true,
            'order' => 5,
            'conditional_logic' => [
                'show_if' => [
                    'question' => 1,
                    'answers' => ['Employed (Full-Time)', 'Employed (Part-Time)', 'Self-Employed']
                ]
            ],
        ]);

        // Question 6: Job Satisfaction Rating
        SurveyQuestion::create([
            'survey_id' => $survey->id,
            'question_text' => 'How satisfied are you with your current job?',
            'description' => 'Rate your overall job satisfaction',
            'question_type' => 'rating',
            'rating_min' => 1,
            'rating_max' => 5,
            'rating_min_label' => 'Very Dissatisfied',
            'rating_max_label' => 'Very Satisfied',
            'is_required' => true,
            'order' => 6,
            'conditional_logic' => [
                'show_if' => [
                    'question' => 1,
                    'answers' => ['Employed (Full-Time)', 'Employed (Part-Time)', 'Self-Employed']
                ]
            ],
        ]);

        // Question 7: Satisfaction Aspects (Matrix)
        SurveyQuestion::create([
            'survey_id' => $survey->id,
            'question_text' => 'Please rate your satisfaction with the following aspects of your job:',
            'description' => 'Rate each aspect from 1 (Very Dissatisfied) to 5 (Very Satisfied)',
            'question_type' => 'matrix',
            'matrix_rows' => [
                'Salary and benefits',
                'Work-life balance',
                'Career growth opportunities',
                'Work environment',
                'Job security',
                'Use of skills from degree',
                'Relationship with colleagues',
                'Management and leadership'
            ],
            'matrix_columns' => ['1', '2', '3', '4', '5'],
            'is_required' => false,
            'order' => 7,
            'conditional_logic' => [
                'show_if' => [
                    'question' => 1,
                    'answers' => ['Employed (Full-Time)', 'Employed (Part-Time)', 'Self-Employed']
                ]
            ],
        ]);

        // Question 8: Current Salary Range
        SurveyQuestion::create([
            'survey_id' => $survey->id,
            'question_text' => 'What is your current annual salary range?',
            'description' => 'Select your salary range (optional but helps us track employment outcomes)',
            'question_type' => 'dropdown',
            'options' => [
                'Below ₱200,000',
                '₱200,000 - ₱300,000',
                '₱300,000 - ₱400,000',
                '₱400,000 - ₱500,000',
                '₱500,000 - ₱750,000',
                '₱750,000 - ₱1,000,000',
                'Above ₱1,000,000',
                'Prefer not to say'
            ],
            'is_required' => false,
            'order' => 8,
            'conditional_logic' => [
                'show_if' => [
                    'question' => 1,
                    'answers' => ['Employed (Full-Time)', 'Employed (Part-Time)', 'Self-Employed']
                ]
            ],
        ]);

        // Question 9: Skills Used
        SurveyQuestion::create([
            'survey_id' => $survey->id,
            'question_text' => 'Which skills from your degree do you use most in your current job?',
            'description' => 'Select all that apply',
            'question_type' => 'multiple_choice',
            'options' => [
                'Technical/specialized knowledge',
                'Research and analysis',
                'Critical thinking',
                'Communication skills',
                'Teamwork and collaboration',
                'Problem-solving',
                'Leadership',
                'Project management',
                'Computer/technology skills',
                'None - my job doesn\'t use skills from my degree'
            ],
            'is_required' => false,
            'order' => 9,
            'conditional_logic' => [
                'show_if' => [
                    'question' => 1,
                    'answers' => ['Employed (Full-Time)', 'Employed (Part-Time)', 'Self-Employed']
                ]
            ],
        ]);

        // Question 10: Unemployment Reason
        SurveyQuestion::create([
            'survey_id' => $survey->id,
            'question_text' => 'What is the main reason you are currently unemployed?',
            'description' => 'Select the option that best describes your situation',
            'question_type' => 'single_choice',
            'options' => [
                'Lack of job opportunities in my field',
                'Overqualified for available positions',
                'Underqualified - need additional training/certifications',
                'Location constraints',
                'Health reasons',
                'Family obligations',
                'Continuing education/further studies',
                'Recently graduated - still searching',
                'Other'
            ],
            'is_required' => false,
            'order' => 10,
            'conditional_logic' => [
                'show_if' => [
                    'question' => 1,
                    'answers' => ['Unemployed (Seeking Employment)', 'Unemployed (Not Seeking)']
                ]
            ],
        ]);

        // Question 11: How education prepared you
        SurveyQuestion::create([
            'survey_id' => $survey->id,
            'question_text' => 'How well did your education prepare you for your career?',
            'description' => 'Rate from 1 (Not at all prepared) to 5 (Extremely well prepared)',
            'question_type' => 'rating',
            'rating_min' => 1,
            'rating_max' => 5,
            'rating_min_label' => 'Not Prepared',
            'rating_max_label' => 'Very Well Prepared',
            'is_required' => true,
            'order' => 11,
        ]);

        // Question 12: Recommendations for improvement
        SurveyQuestion::create([
            'survey_id' => $survey->id,
            'question_text' => 'What could the university have done better to prepare you for your career?',
            'description' => 'Please share your suggestions and feedback',
            'question_type' => 'textarea',
            'placeholder' => 'Your feedback helps us improve our programs for future students...',
            'is_required' => false,
            'order' => 12,
        ]);

        // Question 13: Additional comments
        SurveyQuestion::create([
            'survey_id' => $survey->id,
            'question_text' => 'Any additional comments or feedback?',
            'description' => 'Feel free to share anything else you\'d like us to know',
            'question_type' => 'textarea',
            'is_required' => false,
            'order' => 13,
        ]);

        $this->command->info('Job Mismatch Survey created successfully!');
        $this->command->info('Survey ID: ' . $survey->id);
        $this->command->info('Total Questions: ' . $survey->questions()->count());
    }
}
