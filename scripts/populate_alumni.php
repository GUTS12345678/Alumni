<?php
/**
 * Populate Alumni Bank with realistic data based on 
 * the Alumni Registration & Initial Survey structure.
 * 
 * Each alumni is unique, distributed across Manila (campus 1) and Cavite (campus 2).
 * Fields mirror what the survey registration collects.
 */

require_once __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\AlumniProfile;
use App\Models\User;
use App\Models\Batch;
use App\Models\Course;
use App\Models\Department;
use App\Models\Campus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;

// ─── Configuration ──────────────────────────────────────────
$TOTAL_ALUMNI = 400; // Total alumni to create
$MANILA_RATIO = 0.6; // 60% Manila, 40% Cavite

// ─── Filipino name pools ────────────────────────────────────
$firstNamesMale = [
    'Adrian', 'Angelo', 'Antonio', 'Arjay', 'Benedict', 'Bryan', 'Carlo', 'Christian', 'Daniel', 'David',
    'Eduardo', 'Emmanuel', 'Francis', 'Gabriel', 'Harold', 'Ivan', 'James', 'Jayson', 'John', 'Jose',
    'Joshua', 'Juan', 'Karl', 'Kenneth', 'Kevin', 'Lawrence', 'Leonardo', 'Luis', 'Manuel', 'Marco',
    'Mark', 'Michael', 'Miguel', 'Nathan', 'Neil', 'Oliver', 'Patrick', 'Paul', 'Pedro', 'Rafael',
    'Ramon', 'Raphael', 'Rico', 'Robert', 'Rodrigo', 'Ryan', 'Samuel', 'Sebastian', 'Vincent', 'Wilfred',
    'Aldrin', 'Andrei', 'Bernardo', 'Chester', 'Clarence', 'Dario', 'Darwin', 'Dennis', 'Dominic', 'Edgar',
    'Elijah', 'Enrique', 'Felix', 'Fernando', 'Frederick', 'Gerardo', 'Gilbert', 'Guillermo', 'Henry', 'Herbert',
    'Ian', 'Isaac', 'Jericho', 'Jerome', 'Joel', 'Jonathan', 'Julio', 'Kurt', 'Lance', 'Lester',
    'Lorenzo', 'Marvin', 'Mateo', 'Nathaniel', 'Noel', 'Orlando', 'Oscar', 'Paolo', 'Philip', 'Ramil',
    'Randy', 'Renato', 'Ricardo', 'Rodel', 'Ronaldo', 'Ruben', 'Salvador', 'Teodoro', 'Victor', 'Xavier',
];

$firstNamesFemale = [
    'Abigail', 'Alexandra', 'Alyssa', 'Andrea', 'Angela', 'Anna', 'Beatriz', 'Bianca', 'Camille', 'Carla',
    'Carmen', 'Catherine', 'Cecilia', 'Christine', 'Claudia', 'Cristina', 'Daniela', 'Diana', 'Elena', 'Elizabeth',
    'Emily', 'Erica', 'Fatima', 'Gabriela', 'Grace', 'Hannah', 'Isabela', 'Jasmine', 'Jennifer', 'Jessica',
    'Joanna', 'Joyce', 'Julia', 'Karen', 'Katherine', 'Kimberly', 'Lara', 'Laura', 'Lea', 'Lorraine',
    'Lucia', 'Maria', 'Mariel', 'Mary', 'Melissa', 'Michelle', 'Monica', 'Nicole', 'Olivia', 'Patricia',
    'Paula', 'Rachel', 'Rebecca', 'Rosa', 'Rosemary', 'Ruth', 'Samantha', 'Sandra', 'Sarah', 'Sophia',
    'Stephanie', 'Teresa', 'Theresa', 'Trisha', 'Valentina', 'Vanessa', 'Veronica', 'Victoria', 'Yvonne', 'Zenaida',
    'Aileen', 'Alicia', 'Angelica', 'Bernadette', 'Charisse', 'Clarisse', 'Daisy', 'Dulce', 'Edna', 'Elaine',
    'Esperanza', 'Felicia', 'Gemma', 'Glenda', 'Helena', 'Irene', 'Janine', 'Jessa', 'Katrina', 'Kristine',
    'Leonor', 'Lorna', 'Marian', 'Maribel', 'Noemi', 'Pamela', 'Queenie', 'Rhea', 'Rowena', 'Sheila',
];

$lastNames = [
    'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Tomas', 'Andrada',
    'Ramos', 'Aquino', 'Dela Cruz', 'Rivera', 'Fernandez', 'Lopez', 'Martinez', 'Gomez', 'Diaz', 'Perez',
    'Villanueva', 'Castro', 'Manalo', 'Salvador', 'Navarro', 'Pascual', 'De Leon', 'Flores', 'Santiago', 'Rosario',
    'Mercado', 'Hernandez', 'Gonzales', 'Luna', 'Corpuz', 'Francisco', 'Soriano', 'Tolentino', 'Valencia', 'Enriquez',
    'Aguilar', 'Morales', 'Espinosa', 'Gutierrez', 'Marquez', 'Rojas', 'Salazar', 'Cabrera', 'Castillo', 'Domingo',
    'Estrada', 'Concepcion', 'Del Rosario', 'Lim', 'Tan', 'Chua', 'Go', 'Sy', 'Ong', 'Ang',
    'Panganiban', 'Vitug', 'Manalang', 'Pangilinan', 'Constantino', 'De Guzman', 'Lacson', 'Macapagal', 'Magsaysay', 'Pimentel',
    'Buenaventura', 'Dimaculangan', 'Evangelista', 'Ilagan', 'Magbanua', 'Padilla', 'Quizon', 'Sibayan', 'Tejada', 'Zamora',
];

$middleNames = [
    'Aguilar', 'Bernal', 'Cortez', 'Delos Santos', 'Espiritu', 'Fuentes', 'Galvez', 'Hilario',
    'Ignacio', 'Jimenez', 'Katigbak', 'Laurel', 'Magat', 'Nazareno', 'Ortega', 'Ponce',
    'Quintos', 'Ramirez', 'Sta. Maria', 'Trinidad', 'Umali', 'Vera', 'Yap', 'Zarate',
    null, null, null, null, // Some people have no middle name
];

// ─── Employment data pools ──────────────────────────────────
$employmentStatuses = [
    'employed_full_time' => 45,
    'employed_part_time' => 10,
    'self_employed' => 8,
    'unemployed_seeking' => 15,
    'unemployed_not_seeking' => 5,
    'continuing_education' => 12,
    'other' => 5,
];

$jobTitles = [
    'Software Developer', 'Senior Software Developer', 'Web Developer', 'Full Stack Developer',
    'System Administrator', 'Network Engineer', 'IT Support Specialist', 'Database Administrator',
    'Project Manager', 'Business Analyst', 'Data Analyst', 'Quality Assurance Engineer',
    'Civil Engineer', 'Structural Engineer', 'Mechanical Engineer', 'Electrical Engineer',
    'Architect', 'Interior Designer', 'Graphic Designer', 'UI/UX Designer',
    'Teacher', 'Professor', 'School Administrator', 'Guidance Counselor',
    'Accountant', 'Financial Analyst', 'Bank Teller', 'Auditor',
    'Marketing Manager', 'Sales Representative', 'HR Manager', 'Operations Manager',
    'Chef', 'Hotel Manager', 'Restaurant Manager', 'Tourism Officer',
    'Police Officer', 'Public Administrator', 'Government Employee', 'Barangay Officer',
    'Entrepreneur', 'Freelancer', 'Consultant', 'Virtual Assistant',
    'Nurse', 'Medical Technologist', 'Pharmacist', 'Call Center Agent',
    'Research Assistant', 'Laboratory Technician', 'Production Supervisor', 'Plant Manager',
    'Electrician', 'Electronics Technician', 'Automotive Mechanic', 'Industrial Technician',
];

$employers = [
    'Accenture Philippines', 'Aboitiz Group', 'ARUP', 'Ayala Corporation', 'BDO Unibank',
    'BPI', 'Cebu Pacific', 'Converge ICT', 'DITO Telecommunity', 'DMCI Holdings',
    'Globe Telecom', 'GMA Network', 'Grab Philippines', 'International Container Terminal Services',
    'Jollibee Foods Corporation', 'Megaworld Corporation', 'Metrobank', 'PLDT Inc.',
    'San Miguel Corporation', 'SM Investments', 'Security Bank', 'Smart Communications',
    'Sunlife Philippines', 'Tyson Foods', 'UnionBank', 'Universal Robina Corporation',
    'Manila Water', 'Meralco', 'Department of Education', 'Department of Public Works',
    'Philippine National Police', 'Bureau of Internal Revenue', 'Land Bank of the Philippines',
    'City Government of Manila', 'Provincial Government of Cavite', 'PAGCOR',
    'St. Luke\'s Medical Center', 'Philippine General Hospital', 'Makati Medical Center',
    'Intel Philippines', 'Texas Instruments Philippines', 'Analog Devices',
    'Emerson Electric', 'Schneider Electric Philippines', 'Manila Electric Company',
    'SM Engineering Design & Development', 'AECOM Philippines', 'Hilti Philippines',
    'Thinking Machines', 'Kumu', 'Coins.ph', 'Maya Philippines', 'Canva Philippines',
    null, null, null, // Some employed people may not have filled this
];

$companyIndustries = [
    'Information Technology', 'Banking & Finance', 'Education', 'Government',
    'Engineering & Construction', 'Healthcare', 'Telecommunications', 'Manufacturing',
    'Hospitality & Tourism', 'Retail & Consumer Goods', 'Energy & Utilities',
    'Real Estate', 'Transportation', 'Media & Entertainment', 'Agriculture',
    'BPO / Call Center', 'Legal', 'Non-Profit', 'Architecture & Design',
];

$cities = [
    // Manila area
    'Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Mandaluyong', 'Pasay',
    'Caloocan', 'Malabon', 'Navotas', 'Valenzuela', 'San Juan', 'Marikina', 'Parañaque',
    'Las Piñas', 'Muntinlupa', 'Pateros',
    // Cavite area
    'Dasmariñas', 'Imus', 'Bacoor', 'General Trias', 'Cavite City', 'Rosario',
    'Silang', 'Tagaytay', 'Trece Martires', 'Naic', 'Tanza', 'Noveleta',
];

$addresses = [
    'Brgy. 630, Sta. Mesa', 'Brgy. San Antonio, Makati', 'Brgy. Bagong Pag-asa, QC',
    'Brgy. Poblacion, Taguig', 'Brgy. San Rafael, Pasay', 'Brgy. Malamig, Mandaluyong',
    'Brgy. Salawag, Dasmariñas', 'Brgy. Molino, Bacoor', 'Brgy. Tanzang Luma, Imus',
    'Brgy. San Francisco, Gen. Trias', 'Brgy. Bucana, Rosario', 'Brgy. Luciano, Naic',
    'Blk 5 Lot 12, Villa de Primarosa', 'Unit 4A, Green Residences', '123 Aurora Blvd.',
    '456 Taft Avenue', '789 España Boulevard', 'Phase 3, Lancaster New City',
    'Lot 8, Brgy. Iruhin South, Tagaytay', '22 Aguinaldo Highway, Trece Martires',
];

$unemploymentReasons = [
    'lack_of_opportunities', 'overqualified', 'underqualified', 'location_constraints',
    'health_reasons', 'family_obligations', 'continuing_education', 'other',
];

$salaryRanges = [
    'below_15k', '15k_25k', '25k_35k', '35k_50k',
    '50k_75k', '75k_100k', 'above_100k',
];

$mismatchReasons = ['none', 'overqualified', 'underqualified', 'unfit'];
$mismatchWeights = [60, 15, 10, 15];

$locationTypes = ['local', 'foreign', 'remote'];
$locationWeights = [75, 15, 10];

// ─── Helper functions ───────────────────────────────────────
function weightedRandom(array $items, array $weights): string {
    $totalWeight = array_sum($weights);
    $rand = mt_rand(1, $totalWeight);
    $cumulative = 0;
    $keys = array_values($items);
    foreach ($weights as $i => $w) {
        $cumulative += $w;
        if ($rand <= $cumulative) {
            return $keys[$i];
        }
    }
    return end($keys);
}

function pickWeightedStatus(array $statusWeights): string {
    $total = array_sum($statusWeights);
    $rand = mt_rand(1, $total);
    $cumulative = 0;
    foreach ($statusWeights as $status => $weight) {
        $cumulative += $weight;
        if ($rand <= $cumulative) {
            return $status;
        }
    }
    return array_key_last($statusWeights);
}

// ─── Load data ──────────────────────────────────────────────

// Get courses by campus
$mainCourses = Course::whereHas('department', fn($q) => $q->where('campus_id', 1))
    ->where('name', 'not like', '%Doctor%')
    ->where('name', 'not like', '%Master%')
    ->with('department:id,name,campus_id')
    ->get();

$cavCourses = Course::whereHas('department', fn($q) => $q->where('campus_id', 2))
    ->with('department:id,name,campus_id')
    ->get();

// Batches by campus and year
$mainBatches = Batch::where('campus_id', 1)->where('status', 'active')->get()->keyBy('graduation_year');
$cavBatches = Batch::where('campus_id', 2)->where('status', 'active')->get()->keyBy('graduation_year');

$graduationYears = range(2016, 2025);

echo "Creating {$TOTAL_ALUMNI} alumni profiles...\n";
echo "Main campus courses: " . $mainCourses->count() . ", Cavite campus courses: " . $cavCourses->count() . "\n\n";

// ─── Generate Alumni ────────────────────────────────────────
$usedEmails = [];
$usedStudentIds = [];
$created = 0;
$manilaCount = 0;
$caviteCount = 0;

DB::beginTransaction();

try {
    for ($i = 0; $i < $TOTAL_ALUMNI; $i++) {
        // Decide campus
        $isManila = ($i / $TOTAL_ALUMNI) < $MANILA_RATIO;
        $campusId = $isManila ? 1 : 2;

        // Pick gender
        $gender = mt_rand(0, 100) < 50 ? 'Male' : 'Female';
        $firstName = $gender === 'Male'
            ? $firstNamesMale[array_rand($firstNamesMale)]
            : $firstNamesFemale[array_rand($firstNamesFemale)];
        $lastName = $lastNames[array_rand($lastNames)];
        $middleName = $middleNames[array_rand($middleNames)];

        // Generate unique email
        $emailBase = strtolower(str_replace(' ', '', $firstName)) . '.' . strtolower(str_replace(' ', '', $lastName));
        $email = $emailBase . ($i + 1) . '@alumni.earist.edu.ph';
        while (isset($usedEmails[$email])) {
            $email = $emailBase . mt_rand(100, 9999) . '@alumni.earist.edu.ph';
        }
        $usedEmails[$email] = true;

        // Generate unique student ID (format: YYY-XXXXXC where C is M or V)
        $campusCode = $isManila ? 'M' : 'V';
        $gradYear = $graduationYears[array_rand($graduationYears)];
        $yearPrefix = substr($gradYear - 4, 1); // enrollment year prefix
        $studentId = '22' . $yearPrefix . '-' . str_pad(mt_rand(10000, 99999), 5, '0', STR_PAD_LEFT) . $campusCode;
        while (isset($usedStudentIds[$studentId])) {
            $studentId = '22' . $yearPrefix . '-' . str_pad(mt_rand(10000, 99999), 5, '0', STR_PAD_LEFT) . $campusCode;
        }
        $usedStudentIds[$studentId] = true;

        // Pick course and department
        if ($isManila) {
            $course = $mainCourses->random();
            $manilaCount++;
        } else {
            $course = $cavCourses->random();
            $caviteCount++;
        }
        $departmentId = $course->department_id;

        // Pick batch
        $batchMap = $isManila ? $mainBatches : $cavBatches;
        $batch = $batchMap->get($gradYear);
        $batchId = $batch ? $batch->id : null;

        // Employment status (weighted)
        $empStatus = pickWeightedStatus($employmentStatuses);
        $isEmployed = in_array($empStatus, ['employed_full_time', 'employed_part_time', 'self_employed']);

        // Employment details only if employed
        $jobTitle = $isEmployed ? $jobTitles[array_rand($jobTitles)] : null;
        $employer = $isEmployed ? $employers[array_rand($employers)] : null;
        $industry = $isEmployed ? $companyIndustries[array_rand($companyIndustries)] : null;
        $salary = $isEmployed ? $salaryRanges[array_rand($salaryRanges)] : null;
        $locationType = $isEmployed ? weightedRandom($locationTypes, $locationWeights) : null;

        // Job alignment (only for employed)
        $mismatchReason = $isEmployed ? weightedRandom($mismatchReasons, $mismatchWeights) : null;

        // Job start date (for employed, some time after graduation)
        $jobStartDate = null;
        if ($isEmployed) {
            $monthsAfterGrad = mt_rand(1, 24); // 1 to 24 months after graduation
            $jobStartDate = "{$gradYear}-" . str_pad(mt_rand(1, 12), 2, '0', STR_PAD_LEFT) . '-' . str_pad(mt_rand(1, 28), 2, '0', STR_PAD_LEFT);
            // Make sure job start is after graduation
            $gradDateTs = strtotime("{$gradYear}-06-01");
            $jobDateTs = strtotime($jobStartDate);
            if ($jobDateTs < $gradDateTs) {
                $jobStartDate = date('Y-m-d', $gradDateTs + ($monthsAfterGrad * 30 * 86400));
            }
        }

        // Unemployment reason (for unemployed)
        $unemployReason = (!$isEmployed && $empStatus !== 'continuing_education' && $empStatus !== 'other')
            ? $unemploymentReasons[array_rand($unemploymentReasons)]
            : null;

        // Personal details
        $birthYear = $gradYear - mt_rand(21, 28);
        $birthMonth = str_pad(mt_rand(1, 12), 2, '0', STR_PAD_LEFT);
        $birthDay = str_pad(mt_rand(1, 28), 2, '0', STR_PAD_LEFT);
        $birthDate = "{$birthYear}-{$birthMonth}-{$birthDay}";
        $age = 2026 - $birthYear;

        $civilStatuses = ['Single', 'Married', 'Widowed', 'Separated'];
        $civilStatus = $civilStatuses[array_rand($civilStatuses)];

        // Address based on campus
        $address = $addresses[array_rand($addresses)];
        $city = $isManila
            ? $cities[array_rand(array_slice($cities, 0, 17))]
            : $cities[array_rand(array_slice($cities, 17))];

        $phone = '09' . mt_rand(100000000, 999999999);
        $willingToMentor = mt_rand(0, 1);
        $willingToHire = mt_rand(0, 1);

        // Create user account
        $user = User::create([
            'name' => "{$firstName} {$lastName}",
            'email' => $email,
            'password' => Hash::make('alumni' . $gradYear),
            'role' => 'alumni',
            'status' => 'active',
            'campus_id' => $campusId,
        ]);

        // Create alumni profile
        AlumniProfile::create([
            'user_id' => $user->id,
            'campus_id' => $campusId,
            'batch_id' => $batchId,
            'department_id' => $departmentId,
            'course_id' => $course->id,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'middle_name' => $middleName,
            'student_id' => $studentId,
            'gender' => $gender,
            'birth_date' => $birthDate,
            'age' => $age,
            'civil_status' => $civilStatus,
            'phone' => $phone,
            'mobile_no' => $phone,
            'current_address' => $address,
            'city' => $city,
            'country' => 'Philippines',
            'degree_program' => $course->name,
            'major' => $course->name,
            'graduation_year' => $gradYear,
            'graduation_date' => "{$gradYear}-06-01",
            'enrollment_year' => $gradYear - 4,
            'employment_status' => $empStatus,
            'current_job_title' => $jobTitle,
            'current_employer' => $employer,
            'company_industry' => $industry,
            'salary_range' => $salary,
            'job_start_date' => $jobStartDate,
            'job_mismatch_reason' => $mismatchReason,
            'employment_location_type' => $locationType,
            'unemployment_reason' => $unemployReason,
            'willing_to_mentor' => $willingToMentor,
            'willing_to_hire_alumni' => $willingToHire,
            'profile_complete' => true,
            'import_source' => 'survey_registration_seed',
        ]);

        $created++;

        if ($created % 50 === 0) {
            echo "  Created {$created}/{$TOTAL_ALUMNI}...\n";
        }
    }

    DB::commit();

    // Flush all analytics caches
    $campusIds = Campus::pluck('id')->toArray();
    foreach (array_merge(['all'], $campusIds) as $cId) {
        Cache::forget('dashboard_metrics_' . $cId);
        Cache::forget('alumni_stats_' . $cId);
        Cache::forget('analytics_overview_' . $cId);
        Cache::forget('analytics_time_to_job_' . $cId . '_all');
        Cache::forget('analytics_comprehensive_' . $cId);
    }

    echo "\n✅ Done! Created {$created} alumni profiles.\n";
    echo "  Manila (Campus 1): {$manilaCount}\n";
    echo "  Cavite (Campus 2): {$caviteCount}\n";
    echo "  Analytics caches cleared.\n";

    // Quick stats
    $empStats = AlumniProfile::select('employment_status', DB::raw('COUNT(*) as c'))
        ->groupBy('employment_status')
        ->get();
    echo "\n=== Employment Distribution ===\n";
    foreach ($empStats as $s) {
        echo "  {$s->employment_status}: {$s->c}\n";
    }

    $yearStats = AlumniProfile::select('graduation_year', DB::raw('COUNT(*) as c'))
        ->groupBy('graduation_year')
        ->orderBy('graduation_year')
        ->get();
    echo "\n=== Graduation Year Distribution ===\n";
    foreach ($yearStats as $s) {
        echo "  {$s->graduation_year}: {$s->c}\n";
    }

} catch (\Exception $e) {
    DB::rollBack();
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
