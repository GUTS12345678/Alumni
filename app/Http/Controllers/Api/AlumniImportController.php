<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlumniProfile;
use App\Models\Batch;
use App\Models\Campus;
use App\Models\Course;
use App\Models\Department;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class AlumniImportController extends Controller
{
    /**
     * Preview an Excel file before importing.
     * Returns parsed rows, auto-detected info, and warnings.
     */
    public function preview(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
            'campus_id' => 'nullable|integer|exists:campuses,id',
            'header_row' => 'nullable|integer|min:1|max:20',
            'data_start_row' => 'nullable|integer|min:2|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $highestRow = $sheet->getHighestRow();
            $headerRow = $request->input('header_row', 3);
            $dataStartRow = $request->input('data_start_row', 4);

            // Try to auto-detect department from header rows
            $detectedDepartment = null;
            $detectedYear = null;
            $headerText = null;
            for ($r = 1; $r < $headerRow; $r++) {
                for ($c = 'A'; $c <= 'K'; $c++) {
                    $cellValue = trim((string) $sheet->getCell($c . $r)->getValue());
                    if (!empty($cellValue)) {
                        // Look for department name pattern
                        if (preg_match('/(?:ALUMNI\s+DIRECTORY\s*-?\s*)(.*?)(?:\s+\d{4})?$/i', $cellValue, $matches)) {
                            $deptText = trim($matches[1]);
                            $headerText = $cellValue;
                            $campusForDetect = $request->campus_id ?: 1;
                            $detectedDepartment = $this->matchDepartment($deptText, $campusForDetect);
                        }
                        // Look for year
                        if (preg_match('/(\d{4})/', $cellValue, $yearMatches)) {
                            $detectedYear = (int) $yearMatches[1];
                        }
                    }
                }
            }

            // Parse preview rows (first 10 data rows)
            $previewRows = [];
            $totalDataRows = 0;
            $warnings = [];

            // Load courses - either for specific campus or all
            $campusId = $request->campus_id;
            if ($campusId) {
                $departmentIds = Department::where('campus_id', $campusId)->pluck('id')->toArray();
                $courses = Course::whereIn('department_id', $departmentIds)->get();
            } else {
                $courses = Course::all();
            }

            for ($row = $dataStartRow; $row <= $highestRow; $row++) {
                $rowData = $this->parseRow($sheet, $row);

                // Skip completely empty rows
                if ($this->isEmptyRow($rowData)) {
                    continue;
                }

                $totalDataRows++;

                if (count($previewRows) < 10) {
                    // Check for course match
                    $courseMatch = null;
                    if (!empty($rowData['degree_program'])) {
                        $courseMatch = $this->fuzzyMatchCourse($rowData['degree_program'], $courses, $detectedDepartment ? $detectedDepartment['id'] : null);
                    }

                    // Check for duplicate
                    $isDuplicate = false;
                    if (!empty($rowData['student_id'])) {
                        $isDuplicate = AlumniProfile::where('student_id', $rowData['student_id'])->exists();
                    }

                    // Check for email duplicate
                    $emailDuplicate = false;
                    if (!empty($rowData['email'])) {
                        $emailDuplicate = User::where('email', $rowData['email'])->exists();
                    }

                    $previewRows[] = array_merge($rowData, [
                        'row_number' => $row,
                        'course_match' => $courseMatch ? [
                            'id' => $courseMatch->id,
                            'name' => $courseMatch->name,
                            'code' => $courseMatch->code,
                        ] : null,
                        'is_duplicate' => $isDuplicate,
                        'email_duplicate' => $emailDuplicate,
                    ]);
                }

                // Collect warnings for missing data
                if (empty($rowData['email'])) {
                    $warnings[] = [
                        'row' => $row,
                        'message' => "No email — placeholder will be generated"
                    ];
                }
            }

            // Get batches for the campus (use selected campus or default to 1)
            $batchCampusId = $campusId ?: 1;
            $batches = Batch::where('campus_id', $batchCampusId)
                ->orderBy('graduation_year', 'desc')
                ->get(['id', 'name', 'graduation_year']);

            // Get departments for the campus
            $departments = Department::where('campus_id', $batchCampusId)
                ->get(['id', 'name', 'code']);

            // Count duplicates from preview rows
            $duplicatesFound = collect($previewRows)->where('is_duplicate', true)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'filename' => $file->getClientOriginalName(),
                    'total_rows' => $totalDataRows,
                    'duplicates_found' => $duplicatesFound,
                    'preview_rows' => $previewRows,
                    'detected_department' => $detectedDepartment,
                    'detected_year' => $detectedYear,
                    'header_text' => $headerText,
                    'warnings_count' => count($warnings),
                    'warnings' => array_slice(array_map(function ($w) {
                        return is_array($w) ? ($w['message'] ?? json_encode($w)) : $w;
                    }, $warnings), 0, 20),
                    'available_batches' => $batches,
                    'available_departments' => $departments,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Alumni import preview error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to parse Excel file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import alumni from Excel file.
     */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
            'campus_id' => 'required|integer|exists:campuses,id',
            'batch_id' => 'nullable|integer|exists:batches,id',
            'department_id' => 'nullable|integer|exists:departments,id',
            'duplicate_action' => 'required|in:skip,update',
            'header_row' => 'nullable|integer|min:1|max:20',
            'data_start_row' => 'nullable|integer|min:2|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $sheet = $spreadsheet->getActiveSheet();
            $highestRow = $sheet->getHighestRow();
            $headerRow = $request->input('header_row', 3);
            $dataStartRow = $request->input('data_start_row', 4);

            $campusId = $request->campus_id;
            $batchId = $request->batch_id ?: null;
            $departmentId = $request->department_id ?: null;
            $duplicateAction = $request->duplicate_action;
            $filename = $file->getClientOriginalName();

            // Try to auto-detect department from header if not specified
            if (!$departmentId) {
                for ($r = 1; $r < $headerRow; $r++) {
                    for ($c = 'A'; $c <= 'K'; $c++) {
                        $cellValue = trim((string) $sheet->getCell($c . $r)->getValue());
                        if (!empty($cellValue) && preg_match('/(?:ALUMNI\s+DIRECTORY\s*-?\s*)(.*?)(?:\s+\d{4})?$/i', $cellValue, $matches)) {
                            $deptText = trim($matches[1]);
                            $dept = $this->matchDepartment($deptText, $campusId);
                            if ($dept) {
                                $departmentId = $dept['id'];
                            }
                        }
                    }
                }
            }

            // Load courses for the department (or all campus courses if no department)
            if ($departmentId) {
                $courses = Course::where('department_id', $departmentId)->get();
            } else {
                $deptIds = Department::where('campus_id', $campusId)->pluck('id')->toArray();
                $courses = Course::whereIn('department_id', $deptIds)->get();
            }

            // Get batch info for graduation_year
            $batch = $batchId ? Batch::find($batchId) : null;

            $summary = [
                'total_rows' => 0,
                'imported' => 0,
                'updated' => 0,
                'skipped_duplicates' => 0,
                'errors' => 0,
            ];
            $errors = [];
            $warnings = [];

            DB::beginTransaction();

            try {
                for ($row = $dataStartRow; $row <= $highestRow; $row++) {
                    $rowData = $this->parseRow($sheet, $row);

                    // Skip empty rows
                    if ($this->isEmptyRow($rowData)) {
                        continue;
                    }

                    $summary['total_rows']++;

                    try {
                        $result = $this->processRow(
                            $rowData,
                            $row,
                            $campusId,
                            $batchId,
                            $departmentId,
                            $courses,
                            $batch,
                            $duplicateAction,
                            $filename,
                            $warnings
                        );

                        if ($result === 'imported') {
                            $summary['imported']++;
                        } elseif ($result === 'updated') {
                            $summary['updated']++;
                        } elseif ($result === 'skipped') {
                            $summary['skipped_duplicates']++;
                        }
                    } catch (\Exception $e) {
                        $summary['errors']++;
                        $errors[] = [
                            'row' => $row,
                            'student_id' => $rowData['student_id'] ?? null,
                            'name' => trim(($rowData['first_name'] ?? '') . ' ' . ($rowData['last_name'] ?? '')),
                            'reason' => $e->getMessage()
                        ];
                    }
                }

                DB::commit();

                // Log the import activity
                if (auth()->check()) {
                    ActivityLog::logActivity(
                        auth()->id(),
                        'alumni_imported',
                        "Imported {$summary['imported']} alumni from {$filename}. " .
                        "Updated: {$summary['updated']}, Skipped: {$summary['skipped_duplicates']}, Errors: {$summary['errors']}",
                        'AlumniProfile',
                        null,
                        [
                            'filename' => $filename,
                            'summary' => $summary,
                        ]
                    );
                }

                return response()->json([
                    'success' => true,
                    'message' => "Import completed. {$summary['imported']} alumni imported successfully.",
                    'data' => [
                        'imported' => $summary['imported'],
                        'skipped' => $summary['skipped_duplicates'],
                        'updated' => $summary['updated'],
                        'total_rows' => $summary['total_rows'],
                        'errors' => $errors,
                    ],
                    'warnings' => array_slice($warnings, 0, 50),
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Alumni import error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Parse a single row from the Excel sheet.
     * Columns: A=Last Name, B=First Name, C=Middle Name, D=Suffix,
     * E=Student No., F=Degree/Program, G=DOB, H=Address, I=Email, J=Contact, K=Gender
     */
    private function parseRow($sheet, int $row): array
    {
        $getValue = function ($col) use ($sheet, $row) {
            $cell = $sheet->getCell($col . $row);
            $value = $cell->getValue();
            return is_string($value) ? trim($value) : $value;
        };

        // Handle date of birth - could be Excel serial number or text
        $dobRaw = $getValue('G');
        $dob = null;
        if (!empty($dobRaw)) {
            $dob = $this->parseDate($dobRaw);
        }

        return [
            'last_name' => (string) ($getValue('A') ?? ''),
            'first_name' => (string) ($getValue('B') ?? ''),
            'middle_name' => (string) ($getValue('C') ?? ''),
            'suffix' => (string) ($getValue('D') ?? ''),
            'student_id' => (string) ($getValue('E') ?? ''),
            'degree_program' => (string) ($getValue('F') ?? ''),
            'birth_date' => $dob,
            'current_address' => (string) ($getValue('H') ?? ''),
            'email' => (string) ($getValue('I') ?? ''),
            'phone' => (string) ($getValue('J') ?? ''),
            'gender' => (string) ($getValue('K') ?? ''),
        ];
    }

    /**
     * Check if a row is completely empty.
     */
    private function isEmptyRow(array $rowData): bool
    {
        return empty($rowData['last_name']) && empty($rowData['first_name']) && empty($rowData['student_id']);
    }

    /**
     * Process a single row — create user + alumni profile.
     */
    private function processRow(
        array $rowData,
        int $rowNumber,
        int $campusId,
        ?int $batchId,
        ?int $departmentId,
        $courses,
        $batch,
        string $duplicateAction,
        string $filename,
        array &$warnings
    ): string {
        // Validate required fields
        if (empty($rowData['last_name'])) {
            throw new \Exception('Missing last name');
        }
        if (empty($rowData['first_name'])) {
            throw new \Exception('Missing first name');
        }

        // Check for duplicate by student_id
        $existingProfile = null;
        if (!empty($rowData['student_id'])) {
            $existingProfile = AlumniProfile::where('student_id', $rowData['student_id'])->first();
        }

        if ($existingProfile) {
            if ($duplicateAction === 'skip') {
                return 'skipped';
            }

            // Update existing profile
            $this->updateExistingProfile($existingProfile, $rowData);
            return 'updated';
        }

        // Map gender
        $gender = $this->mapGender($rowData['gender']);

        // Fuzzy match course
        $courseId = null;
        if (!empty($rowData['degree_program'])) {
            $matchedCourse = $this->fuzzyMatchCourse($rowData['degree_program'], $courses, $departmentId);
            if ($matchedCourse) {
                $courseId = $matchedCourse->id;
            } else {
                $warnings[] = [
                    'row' => $rowNumber,
                    'message' => "Course '{$rowData['degree_program']}' not matched — saved as text only"
                ];
            }
        }

        // Determine email
        $email = $rowData['email'];
        $isPlaceholderEmail = false;
        if (empty($email)) {
            // Generate placeholder email
            $studentIdSlug = !empty($rowData['student_id'])
                ? preg_replace('/[^a-zA-Z0-9]/', '', $rowData['student_id'])
                : strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $rowData['first_name'] . $rowData['last_name'])) . rand(100, 999);
            $email = strtolower($studentIdSlug) . '@imported.alumni';
            $isPlaceholderEmail = true;

            $warnings[] = [
                'row' => $rowNumber,
                'message' => "No email provided — generated placeholder: {$email}"
            ];
        }

        // Check if email already exists in users table
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            // If it's a placeholder email collision, add a random suffix
            if ($isPlaceholderEmail) {
                $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $rowData['student_id'] ?? '')) . '_' . rand(1000, 9999) . '@imported.alumni';
            } else {
                throw new \Exception("Email '{$email}' already exists in the system");
            }
        }

        // Generate password from last name (lowercase, no spaces)
        $rawPassword = strtolower(preg_replace('/\s+/', '', $rowData['last_name']));
        // Minimum 8 chars for password (login form requires min:8)
        if (strlen($rawPassword) < 8) {
            $rawPassword = str_pad($rawPassword, 8, '12345678');
        }

        // Build display name
        $displayName = trim($rowData['first_name'] . ' ' . $rowData['last_name']);

        // Create User
        $user = User::create([
            'name' => $displayName,
            'email' => $email,
            'password' => Hash::make($rawPassword),
            'must_change_password' => true,
            'role' => 'alumni',
            'role_id' => 3,
            'status' => 'active',
            'campus_id' => $campusId,
        ]);

        // Create Alumni Profile
        AlumniProfile::create([
            'user_id' => $user->id,
            'batch_id' => $batchId,
            'department_id' => $departmentId,
            'course_id' => $courseId,
            'campus_id' => $campusId,
            'first_name' => $rowData['first_name'],
            'last_name' => $rowData['last_name'],
            'middle_name' => $rowData['middle_name'] ?: null,
            'suffix' => $rowData['suffix'] ?: null,
            'student_id' => $rowData['student_id'] ?: null,
            'degree_program' => $rowData['degree_program'] ?: null,
            'birth_date' => $rowData['birth_date'],
            'gender' => $gender,
            'phone' => $rowData['phone'] ?: null,
            'alternate_email' => ($isPlaceholderEmail && !empty($rowData['email'])) ? $rowData['email'] : null,
            'current_address' => $rowData['current_address'] ?: null,
            'graduation_year' => $batch ? $batch->graduation_year : null,
            'profile_completed' => false,
            'import_source' => $filename,
            'imported_at' => now(),
        ]);

        return 'imported';
    }

    /**
     * Update an existing alumni profile with imported data (only fill empty fields).
     */
    private function updateExistingProfile(AlumniProfile $profile, array $rowData): void
    {
        $updates = [];

        if (empty($profile->middle_name) && !empty($rowData['middle_name'])) {
            $updates['middle_name'] = $rowData['middle_name'];
        }
        if (empty($profile->suffix) && !empty($rowData['suffix'])) {
            $updates['suffix'] = $rowData['suffix'];
        }
        if (empty($profile->birth_date) && !empty($rowData['birth_date'])) {
            $updates['birth_date'] = $rowData['birth_date'];
        }
        if (empty($profile->phone) && !empty($rowData['phone'])) {
            $updates['phone'] = $rowData['phone'];
        }
        if (empty($profile->current_address) && !empty($rowData['current_address'])) {
            $updates['current_address'] = $rowData['current_address'];
        }
        if (empty($profile->gender) && !empty($rowData['gender'])) {
            $updates['gender'] = $this->mapGender($rowData['gender']);
        }

        if (!empty($updates)) {
            $profile->update($updates);
        }
    }

    /**
     * Map gender text to enum value.
     */
    private function mapGender(string $gender): ?string
    {
        $gender = strtolower(trim($gender));
        $map = [
            'male' => 'male',
            'm' => 'male',
            'female' => 'female',
            'f' => 'female',
            'other' => 'other',
            'prefer not to say' => 'prefer_not_to_say',
        ];

        return $map[$gender] ?? null;
    }

    /**
     * Parse various date formats into Y-m-d string.
     */
    private function parseDate($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        // If it's a numeric value, it's an Excel serial date
        if (is_numeric($value)) {
            try {
                $dateTime = ExcelDate::excelToDateTimeObject((float) $value);
                return $dateTime->format('Y-m-d');
            } catch (\Exception $e) {
                return null;
            }
        }

        // Try common date formats
        $formats = [
            'm/d/Y', 'n/j/Y', 'M d, Y', 'F d, Y',
            'Y-m-d', 'd/m/Y', 'd-m-Y', 'm-d-Y',
            'M j, Y', 'F j, Y', 'd M Y', 'd F Y',
        ];

        $value = trim((string) $value);

        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, $value);
            if ($date !== false) {
                return $date->format('Y-m-d');
            }
        }

        // Last resort: try strtotime
        $timestamp = strtotime($value);
        if ($timestamp !== false) {
            return date('Y-m-d', $timestamp);
        }

        return null;
    }

    /**
     * Fuzzy match a degree program text to a Course record.
     */
    private function fuzzyMatchCourse(string $programText, $courses, ?int $departmentId = null)
    {
        $programText = trim($programText);
        if (empty($programText)) {
            return null;
        }

        $filteredCourses = $departmentId
            ? $courses->where('department_id', $departmentId)
            : $courses;

        // 1. Exact match on name
        $exact = $filteredCourses->first(function ($course) use ($programText) {
            return strtolower($course->name) === strtolower($programText);
        });
        if ($exact) return $exact;

        // 2. Contains match
        $contains = $filteredCourses->first(function ($course) use ($programText) {
            return str_contains(strtolower($course->name), strtolower($programText))
                || str_contains(strtolower($programText), strtolower($course->name));
        });
        if ($contains) return $contains;

        // 3. Similar text match (>80%)
        $bestMatch = null;
        $bestScore = 0;
        foreach ($filteredCourses as $course) {
            similar_text(strtolower($programText), strtolower($course->name), $percent);
            if ($percent > 80 && $percent > $bestScore) {
                $bestScore = $percent;
                $bestMatch = $course;
            }
        }
        if ($bestMatch) return $bestMatch;

        // 4. Code match
        $codeMatch = $filteredCourses->first(function ($course) use ($programText) {
            return strtolower($course->code) === strtolower($programText);
        });
        if ($codeMatch) return $codeMatch;

        // 5. If department filter was applied and no match, try all courses
        if ($departmentId) {
            return $this->fuzzyMatchCourse($programText, $courses, null);
        }

        return null;
    }

    /**
     * Match department text to a Department record.
     */
    private function matchDepartment(string $deptText, int $campusId): ?array
    {
        $deptText = trim($deptText);
        if (empty($deptText)) {
            return null;
        }

        $departments = Department::where('campus_id', $campusId)->get();

        // Exact match
        $exact = $departments->first(function ($dept) use ($deptText) {
            return strtolower($dept->name) === strtolower($deptText);
        });
        if ($exact) return ['id' => $exact->id, 'name' => $exact->name, 'code' => $exact->code];

        // Contains match
        $contains = $departments->first(function ($dept) use ($deptText) {
            return str_contains(strtolower($dept->name), strtolower($deptText))
                || str_contains(strtolower($deptText), strtolower($dept->name));
        });
        if ($contains) return ['id' => $contains->id, 'name' => $contains->name, 'code' => $contains->code];

        // Similar text match
        $bestMatch = null;
        $bestScore = 0;
        foreach ($departments as $dept) {
            similar_text(strtolower($deptText), strtolower($dept->name), $percent);
            if ($percent > 70 && $percent > $bestScore) {
                $bestScore = $percent;
                $bestMatch = $dept;
            }
        }
        if ($bestMatch) return ['id' => $bestMatch->id, 'name' => $bestMatch->name, 'code' => $bestMatch->code];

        return null;
    }

    /**
     * Download import template.
     */
    public function downloadTemplate()
    {
        $templatePath = base_path('2025 Alumni Directory Template.xlsx');

        if (!file_exists($templatePath)) {
            return response()->json([
                'success' => false,
                'message' => 'Template file not found'
            ], 404);
        }

        return response()->download($templatePath, 'Alumni_Import_Template.xlsx');
    }
}
