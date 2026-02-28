<?php
/**
 * Alumni Data Generator
 * 
 * Generates ~800 unique alumni users with realistic Filipino data
 * that matches the registration/survey form values.
 * Preserves admin/super_admin accounts.
 */

// Config
$TARGET_ALUMNI = 800;
$DEFAULT_PASSWORD = password_hash('password', PASSWORD_BCRYPT);
$NOW = date('Y-m-d H:i:s');

$pdo = new PDO('mysql:host=127.0.0.1;dbname=alumni_tracer_system', 'root', '', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

// ============================================================
// STEP 1: Delete existing alumni data (preserve admins)
// ============================================================
echo "Deleting existing alumni data...\n";
$pdo->exec("SET FOREIGN_KEY_CHECKS=0");
$pdo->exec("DELETE ap FROM alumni_profiles ap INNER JOIN users u ON ap.user_id = u.id WHERE u.role = 'alumni'");
// Safely delete from tables that may or may not exist
foreach (['career_histories', 'alumni_connections'] as $table) {
    try { $pdo->exec("DELETE FROM $table WHERE user_id IN (SELECT id FROM users WHERE role='alumni')"); } catch (Exception $e) {}
}
try { $pdo->exec("DELETE FROM alumni_connections WHERE alumni_id IN (SELECT id FROM users WHERE role='alumni') OR connected_alumni_id IN (SELECT id FROM users WHERE role='alumni')"); } catch (Exception $e) {}
$pdo->exec("DELETE FROM users WHERE role = 'alumni'");
$pdo->exec("SET FOREIGN_KEY_CHECKS=1");
echo "Existing alumni data deleted.\n";

// ============================================================
// REFERENCE DATA
// ============================================================

// Main Campus courses (campus_id=1) => [course_id => [dept_id, code, name]]
$mainCourses = [
    4  => [1, 'BS ARCHI.', 'Bachelor of Science in Architecture'],
    5  => [1, 'BSID', 'Bachelor of Science in Interior Design'],
    6  => [1, 'BFA - PAINTING', 'Bachelor in Fine Arts'],
    17 => [1, 'BFA - VISUAL COMMUNICATION', 'Bachelor in Fine Arts'],
    7  => [2, 'BSAP', 'Bachelor of Science in Applied Physics'],
    8  => [2, 'BSPSYCH', 'Bachelor of Science in Psychology'],
    9  => [2, 'BSMATH', 'Bachelor of Science in Mathematics'],
    27 => [3, 'BSCHE', 'BS Chemical Engineering'],
    28 => [3, 'BSCE', 'BS Civil Engineering'],
    29 => [3, 'BSEE', 'BS Electrical Engineering'],
    30 => [3, 'BSECE', 'BS Electronics & Communication Engineering'],
    31 => [3, 'BSME', 'BS Mechanical Engineering'],
    32 => [3, 'BSCOE', 'BS Computer Engineering'],
    39 => [4, 'BSIT-AUTO', 'BS Industrial Technology - Automotive'],
    40 => [4, 'BSIT-ELEC', 'BS Industrial Technology - Electrical'],
    41 => [4, 'BSIT-ELECTRONICS', 'BS Industrial Technology - Electronics'],
    42 => [4, 'BSIT-FOOD', 'BS Industrial Technology - Food'],
    43 => [4, 'BSIT-FASHION', 'BS Industrial Technology - Fashion & Apparel'],
    44 => [4, 'BSIT-CHEM', 'BS Industrial Technology - Industrial Chemistry'],
    45 => [4, 'BSIT-DRAFT', 'BS Industrial Technology - Drafting'],
    46 => [4, 'BSIT-MACHINE', 'BS Industrial Technology - Machine Shop'],
    47 => [4, 'BSIT-RAC', 'BS Industrial Technology - Refrigeration & AC'],
    20 => [5, 'BSE-SCI', 'Bachelor in Secondary Education - Science'],
    21 => [5, 'BSE-MATH', 'Bachelor in Secondary Education - Mathematics'],
    22 => [5, 'BSE-FIL', 'Bachelor in Secondary Education - Filipino'],
    23 => [5, 'BSNED', 'Bachelor in Special Needs Education'],
    24 => [5, 'BTLE-HE', 'Bachelor in Technology & Livelihood Education - Home Economics'],
    25 => [5, 'BTLE-IA', 'Bachelor in Technology & Livelihood Education - Industrial Arts'],
    10 => [6, 'BSBA-MM', 'BSBA - Marketing Management'],
    16 => [6, 'BSBA-HRDM', 'BSBA - Human Resource Development Management'],
    18 => [6, 'BSEM', 'BS Entrepreneurship'],
    19 => [6, 'BSOA', 'BS Office Administration'],
    33 => [7, 'BST', 'BS Tourism Management'],
    34 => [7, 'BSHM', 'BS Hospitality Management'],
    35 => [8, 'BSCRIM', 'BS Criminology'],
    36 => [8, 'BPA', 'Bachelor in Public Administration'],
    37 => [10, 'BSCS', 'BS Computer Science'],
    38 => [10, 'BSIT', 'BS Information Technology'],
];

// Cavite Campus courses (campus_id=2) => [course_id => [dept_id, code]]
$caviteCourses = [
    96  => [26, 'BSEE-CAV', 'BS Electrical Engineering'],
    97  => [26, 'BSME-CAV', 'BS Mechanical Engineering'],
    98  => [26, 'BSCE-CAV', 'BS Civil Engineering'],
    99  => [26, 'BSECE-CAV', 'BS Electronics Engineering'],
    100 => [26, 'BSCPE-CAV', 'BS Computer Engineering'],
    101 => [27, 'BSIT-CAV', 'BS Information Technology'],
    102 => [27, 'BSCS-CAV', 'BS Computer Science'],
    103 => [27, 'BSFT-CAV', 'BS Food Technology'],
    104 => [27, 'BSIET-CAV', 'BS Industrial Engineering Technology'],
    105 => [27, 'BSEET-CAV', 'BS Electrical Engineering Technology'],
    106 => [27, 'BSMET-CAV', 'BS Mechanical Engineering Technology'],
    107 => [28, 'BSBA-FM-CAV', 'BSBA Financial Management'],
    108 => [28, 'BSBA-MM-CAV', 'BSBA Marketing Management'],
    109 => [28, 'BSBA-HRM-CAV', 'BSBA Human Resource Management'],
    110 => [28, 'BSOA-CAV', 'BS Office Administration'],
    111 => [28, 'BSA-CAV', 'BS Accountancy'],
    112 => [29, 'BSMATH-CAV', 'BS Mathematics'],
    113 => [29, 'BSPHY-CAV', 'BS Physics'],
    114 => [29, 'BSCHEM-CAV', 'BS Chemistry'],
    115 => [29, 'BSBIO-CAV', 'BS Biology'],
    116 => [29, 'ABENG-CAV', 'AB English'],
    117 => [29, 'ABCOMM-CAV', 'AB Communication'],
    118 => [30, 'BSED-ENG-CAV', 'BSEd English'],
    119 => [30, 'BSED-MATH-CAV', 'BSEd Mathematics'],
    120 => [30, 'BSED-SCI-CAV', 'BSEd Science'],
    121 => [30, 'BEED-CAV', 'Bachelor of Elementary Education'],
];

// Main Campus batches: batch_id => grad_year
$mainBatches = [
    12 => 2015, 13 => 2016, 14 => 2017, 15 => 2018, 16 => 2019,
    17 => 2020, 18 => 2021, 19 => 2022, 20 => 2023, 21 => 2024, 22 => 2025,
];

// Cavite Campus batches: batch_id => grad_year
$caviteBatches = [
    23 => 2015, 24 => 2016, 25 => 2017, 26 => 2018, 27 => 2019,
    28 => 2020, 29 => 2021, 30 => 2022, 31 => 2023, 32 => 2024, 33 => 2025,
];

// ============================================================
// NAME POOLS (Filipino names)
// ============================================================
$maleFirstNames = [
    'Juan', 'Jose', 'Angelo', 'Mark', 'John', 'Carlo', 'Miguel', 'Rafael', 'Paolo', 'Gabriel',
    'Francis', 'Antonio', 'Andrei', 'Benedict', 'Christian', 'Daniel', 'Eduardo', 'Fernando', 'Gregorio',
    'Harold', 'Ian', 'Jerico', 'Kenneth', 'Lorenzo', 'Manuel', 'Nelson', 'Oliver', 'Patrick', 'Quintin',
    'Ricardo', 'Samuel', 'Theodore', 'Ulysses', 'Vincent', 'William', 'Xavier', 'Yohan', 'Zachary',
    'Adrian', 'Bryan', 'Cedric', 'Dennis', 'Elijah', 'Frederick', 'Gerald', 'Henry', 'Isaac', 'James',
    'Kyle', 'Leo', 'Matthew', 'Nathaniel', 'Oscar', 'Peter', 'Renz', 'Stephen', 'Tristan', 'Victor',
    'Aldrin', 'Bernard', 'Clarence', 'Dominic', 'Emmanuel', 'Felipe', 'Glenn', 'Herbert', 'Ivan', 'Jerome',
    'Kevin', 'Lester', 'Mario', 'Noel', 'Owen', 'Philip', 'Rogelio', 'Sean', 'Timothy', 'Virgilio',
    'Alvin', 'Brent', 'Clark', 'Darren', 'Erwin', 'Franco', 'Gilbert', 'Hector', 'Irvin', 'Joel',
    'Karl', 'Lance', 'Marvin', 'Neil', 'Orlando', 'Paul', 'Raymond', 'Sergio', 'Troy', 'Voltaire',
];

$femaleFirstNames = [
    'Maria', 'Ana', 'Rose', 'Grace', 'Jane', 'Angela', 'Patricia', 'Christine', 'Nicole', 'Stephanie',
    'Jasmine', 'Kathleen', 'Melissa', 'Diana', 'Erica', 'Fatima', 'Giselle', 'Hannah', 'Iris', 'Julia',
    'Karen', 'Liza', 'Michelle', 'Noelle', 'Olivia', 'Princess', 'Queen', 'Rachel', 'Sarah', 'Tiffany',
    'Ursula', 'Vanessa', 'Whitney', 'Yvonne', 'Zenaida', 'Abigail', 'Bianca', 'Camille', 'Denise', 'Eleanor',
    'Faith', 'Gemma', 'Hazel', 'Ivy', 'Joyce', 'Kimberly', 'Lorraine', 'Monica', 'Nadine', 'Pamela',
    'Queenie', 'Regina', 'Samantha', 'Teresa', 'Victoria', 'Wendy', 'Ximena', 'Yolanda', 'Zelda', 'Carmela',
    'Daisy', 'Elaine', 'Florence', 'Gloria', 'Helena', 'Ingrid', 'Joanne', 'Katherine', 'Leah', 'Marian',
    'Nadia', 'Ophelia', 'Pearl', 'Roselyn', 'Sofia', 'Trisha', 'Uma', 'Vivian', 'Wanda', 'Xena',
    'Alicia', 'Bernadette', 'Cecilia', 'Dolores', 'Evelyn', 'Frances', 'Geraldine', 'Heidi', 'Irene', 'Jocelyn',
    'Kristine', 'Lydia', 'Maribel', 'Nina', 'Pauline', 'Rebecca', 'Sheila', 'Theresa', 'Veronica', 'Zara',
];

$lastNames = [
    'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Tomas', 'Andrada',
    'Rivera', 'Flores', 'Lopez', 'Gonzales', 'Hernandez', 'Perez', 'Ramos', 'Aquino', 'Castro', 'Villanueva',
    'Dela Cruz', 'Pascual', 'Manalo', 'Santiago', 'Fernando', 'Rosario', 'Tolentino', 'Navarro', 'Aguilar', 'Soriano',
    'De Leon', 'Mercado', 'Dizon', 'Pangilinan', 'David', 'Valdez', 'Salazar', 'Jimenez', 'Castillo', 'Magno',
    'Lim', 'Tan', 'Chua', 'Ong', 'Sy', 'Co', 'Yu', 'Ang', 'Go', 'Lee',
    'Concepcion', 'Domingo', 'Esperanza', 'Francisco', 'Galvez', 'Ignacio', 'Jacinto', 'Lagman', 'Miranda', 'Natividad',
    'Padilla', 'Quizon', 'Ramirez', 'Serrano', 'Uy', 'Villegas', 'Zamora', 'Alvarez', 'Buenaventura', 'Capulong',
    'De Guzman', 'Estrada', 'Fabian', 'Gutierrez', 'Ilagan', 'Joaquin', 'Luna', 'Magsaysay', 'Nuñez', 'Obispo',
    'Pineda', 'Quisumbing', 'Roxas', 'Sison', 'Tuazon', 'Umali', 'Velasco', 'Yap', 'Zulueta', 'Bagtas',
    'Cabrera', 'Dalisay', 'Enriquez', 'Fajardo', 'Gatchalian', 'Hidalgo', 'Inigo', 'Javier', 'Katigbak', 'Lacson',
];

$middleNames = [
    'Aguilar', 'Bautista', 'Cruz', 'Dela Cruz', 'Espinosa', 'Fernando', 'Garcia', 'Hernandez',
    'Ignacio', 'Jimenez', 'Katigbak', 'Lacson', 'Magno', 'Navarro', 'Ocampo', 'Pascual',
    'Quizon', 'Reyes', 'Santos', 'Torres', 'Umali', 'Valdez', 'Wong', 'Yuson', 'Zamora',
    'Mendoza', 'Ramos', 'Lopez', 'Gonzales', 'Rivera', 'Flores', 'Perez', 'Castro',
    'Aquino', 'Villanueva', 'Manalo', 'Santiago', 'Rosario', 'Tolentino', 'Soriano',
];

$suffixes = [null, null, null, null, null, null, null, null, null, null, // 10x null = 83% no suffix
             'Jr.', 'Sr.', 'III', 'IV'];

// ============================================================
// EMPLOYMENT DATA POOLS
// ============================================================

$employmentStatuses = [
    'employed_full_time' => 40,  // weights (out of 100)
    'employed_part_time' => 12,
    'self_employed' => 10,
    'unemployed_seeking' => 15,
    'unemployed_not_seeking' => 5,
    'continuing_education' => 12,
    'military_service' => 1,
    'other' => 5,
];

$genders = ['male' => 48, 'female' => 48, 'other' => 2, 'prefer_not_to_say' => 2];

$civilStatuses = ['Single', 'Married', 'Separated', 'Widowed', 'Divorced'];
$civilStatusWeights = [55, 35, 5, 3, 2];

$jobLevelPositions = ['Clerical', 'Supervisory', 'Technical', 'Managerial', 'Professional', 'Self-Employed'];
$jobLevelWeights = [15, 12, 25, 10, 30, 8];

$majorLineOfBusiness = ['Education', 'Business', 'Manufacturing', 'Hotel/Restaurant', 'Government', 'Information Tech./Arts', 'Construction/Builder', 'Others'];

$averageMonthlyIncomes = [
    'Below 5,000.00' => 8,
    '5,001.00 to 10,000.00' => 15,
    '10,001.00 to 15,000.00' => 22,
    '15,001.00 to 20,000.00' => 20,
    '20,001.00 to 25,000.00' => 18,
    '25,001.00 & up' => 17,
];

$salaryRanges = [
    'below_15k' => 10,
    '15k_25k' => 20,
    '25k_35k' => 25,
    '35k_50k' => 20,
    '50k_75k' => 12,
    '75k_100k' => 8,
    'above_100k' => 3,
    'prefer_not_say' => 2,
];

$careerFields = [
    'information_technology' => 18,
    'education' => 15,
    'business_management' => 14,
    'healthcare' => 5,
    'engineering' => 15,
    'government' => 8,
    'finance' => 6,
    'marketing' => 5,
    'hospitality' => 5,
    'manufacturing' => 4,
    'agriculture' => 2,
    'other' => 3,
];

$employmentLocationTypes = ['local' => 55, 'foreign' => 15, 'remote' => 20, 'not_applicable' => 10];

$unemploymentReasons = ['lack_of_opportunities', 'overqualified', 'underqualified', 'location_constraints',
    'health_reasons', 'family_obligations', 'continuing_education', 'other'];

$jobMismatchReasons = ['none' => 40, 'career_change' => 15, 'salary' => 12, 'location' => 10,
    'overqualified' => 8, 'underqualified' => 5, 'unfit' => 5, 'other' => 5];

$companySizes = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

// ============================================================
// JOB TITLES & EMPLOYERS PER CAREER FIELD
// ============================================================
$jobTitles = [
    'information_technology' => ['Software Developer', 'Web Developer', 'Systems Analyst', 'IT Support Specialist', 'Network Administrator', 'Database Administrator', 'Full Stack Developer', 'QA Engineer', 'DevOps Engineer', 'UI/UX Designer', 'Mobile App Developer', 'Data Analyst', 'Cybersecurity Analyst', 'Cloud Engineer', 'Technical Lead'],
    'education' => ['Teacher', 'Professor', 'School Administrator', 'Guidance Counselor', 'Academic Coordinator', 'Research Associate', 'Librarian', 'Tutor', 'Training Specialist', 'Curriculum Developer', 'Special Education Teacher', 'Department Head', 'Education Program Specialist'],
    'engineering' => ['Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Electronics Engineer', 'Project Engineer', 'Site Engineer', 'Design Engineer', 'Maintenance Engineer', 'Quality Control Engineer', 'Safety Engineer', 'Structural Engineer', 'Process Engineer'],
    'business_management' => ['Business Analyst', 'Operations Manager', 'Administrative Officer', 'HR Officer', 'Office Manager', 'Executive Assistant', 'Management Trainee', 'Brand Manager', 'Supply Chain Analyst', 'Project Manager'],
    'finance' => ['Accountant', 'Financial Analyst', 'Auditor', 'Bank Teller', 'Investment Analyst', 'Credit Analyst', 'Tax Consultant', 'Loan Officer', 'Budget Analyst', 'Financial Controller'],
    'government' => ['Government Employee', 'Public Administration Officer', 'City Planner', 'Policy Analyst', 'Records Officer', 'Social Worker', 'Community Development Officer', 'Municipal Staff'],
    'healthcare' => ['Nurse', 'Medical Technologist', 'Pharmacist', 'Health Officer', 'Laboratory Technician', 'Physical Therapist', 'Nutritionist', 'Public Health Specialist'],
    'marketing' => ['Marketing Specialist', 'Digital Marketing Manager', 'Content Creator', 'Social Media Manager', 'Sales Representative', 'Brand Strategist', 'Market Research Analyst', 'Advertising Executive'],
    'hospitality' => ['Hotel Manager', 'Restaurant Manager', 'Front Desk Officer', 'Concierge', 'Event Coordinator', 'Tour Guide', 'Travel Consultant', 'Sous Chef', 'Food & Beverage Manager'],
    'manufacturing' => ['Production Supervisor', 'Quality Inspector', 'Plant Manager', 'Industrial Technician', 'Process Technician', 'Machine Operator Supervisor', 'Maintenance Technician'],
    'agriculture' => ['Agricultural Officer', 'Farm Manager', 'Agronomist', 'Agricultural Technician', 'Food Scientist'],
    'other' => ['Freelancer', 'Consultant', 'Entrepreneur', 'Virtual Assistant', 'Call Center Agent', 'BPO Team Leader', 'Graphic Designer'],
];

$employers = [
    'Accenture Philippines', 'Globe Telecom', 'PLDT Inc.', 'SM Investments', 'Ayala Corporation',
    'San Miguel Corporation', 'Jollibee Foods Corp.', 'BDO Unibank', 'Bank of the Philippine Islands',
    'Manila Water Company', 'Meralco', 'Converge ICT Solutions', 'Megaworld Corporation',
    'Universal Robina Corporation', 'International Container Terminal Services',
    'Department of Education', 'Department of Science and Technology', 'Philippine National Police',
    'Department of Public Works and Highways', 'Department of Health',
    'EARIST', 'University of the Philippines', 'Polytechnic University of the Philippines',
    'Technological University of the Philippines', 'De La Salle University',
    'Cognizant Technology Solutions', 'IBM Philippines', 'Oracle Philippines',
    'Samsung Electronics Philippines', 'Intel Products Philippines',
    'ALORICA', 'Teleperformance Philippines', 'Concentrix', 'Sutherland Global Services',
    'TaskUs', 'Infosys BPO', 'HCL Technologies', 'Wipro Philippines',
    'Nestle Philippines', 'Procter & Gamble Philippines', 'Unilever Philippines',
    'Toyota Motor Philippines', 'Honda Philippines', 'Mitsubishi Motors Philippines',
    'Manila Electric Company', 'First Gen Corporation', 'Aboitiz Power',
    'Metro Pacific Investments', 'Robinsons Land Corporation', 'Vista Land & Lifescapes',
    'Philippine Airlines', 'Cebu Pacific', 'Manila Hotel', 'Shangri-La Hotels',
    'City Government of Manila', 'National Housing Authority', 'Social Security System',
    'Philippine Statistics Authority', 'Bureau of Internal Revenue',
    'Philippine General Hospital', 'St. Lukes Medical Center', 'The Medical City',
    'Freelance', 'Self-Employed', 'Own Business',
];

$companyAddresses = [
    'Makati City, Metro Manila', 'Quezon City, Metro Manila', 'Taguig City, Metro Manila',
    'Mandaluyong City, Metro Manila', 'Pasig City, Metro Manila', 'Manila, Metro Manila',
    'Ortigas Center, Pasig City', 'BGC, Taguig City', 'Alabang, Muntinlupa City',
    'Eastwood City, Quezon City', 'Binondo, Manila', 'Ermita, Manila',
    'Cavite City, Cavite', 'Dasmariñas, Cavite', 'Bacoor, Cavite', 'Imus, Cavite',
    'Cebu City, Cebu', 'Davao City', 'Clark, Pampanga', 'Subic Bay, Zambales',
    'Calamba, Laguna', 'Santa Rosa, Laguna', 'Batangas City', 'Lipa, Batangas',
    'San Fernando, Pampanga', 'Angeles City, Pampanga',
    'Remote / Work from Home', 'Singapore', 'Dubai, UAE', 'Tokyo, Japan',
    'Sydney, Australia', 'Toronto, Canada', 'Los Angeles, USA', 'London, UK',
];

$cities = [
    'Manila', 'Quezon City', 'Makati', 'Taguig', 'Pasig', 'Mandaluyong', 'Caloocan',
    'Valenzuela', 'Marikina', 'Parañaque', 'Las Piñas', 'Muntinlupa', 'Navotas',
    'Malabon', 'San Juan', 'Pateros', 'Cavite City', 'Dasmariñas', 'Bacoor', 'Imus',
    'General Trias', 'Rosario', 'Noveleta', 'Kawit', 'Silang', 'Tagaytay',
    'Antipolo', 'Taytay', 'Cainta', 'Angono', 'Binangonan', 'San Mateo',
    'Calamba', 'Santa Rosa', 'Biñan', 'San Pedro', 'Cabuyao',
];

$provinces = [
    'Metro Manila', 'Cavite', 'Laguna', 'Batangas', 'Rizal', 'Bulacan', 'Pampanga',
    'Quezon', 'Zambales', 'Nueva Ecija', 'Pangasinan', 'Tarlac',
];

$skills = [
    'Microsoft Office', 'Google Workspace', 'Communication Skills', 'Leadership', 'Problem Solving',
    'Time Management', 'Critical Thinking', 'Teamwork', 'Project Management', 'Data Analysis',
    'Python', 'Java', 'JavaScript', 'PHP', 'SQL', 'HTML/CSS', 'React', 'Node.js', 'Laravel',
    'AutoCAD', 'SolidWorks', 'MATLAB', 'Adobe Photoshop', 'Adobe Illustrator', 'Figma',
    'Financial Analysis', 'Accounting', 'Bookkeeping', 'Tax Preparation', 'Auditing',
    'Teaching', 'Curriculum Development', 'Classroom Management', 'Educational Technology',
    'Customer Service', 'Sales', 'Marketing Strategy', 'Social Media Management', 'SEO',
    'Network Administration', 'Cybersecurity', 'Cloud Computing', 'Linux', 'Windows Server',
    'Mechanical Design', 'Electrical Wiring', 'PLC Programming', 'Quality Control', 'Six Sigma',
    'Public Speaking', 'Technical Writing', 'Research', 'Strategic Planning', 'Negotiation',
    'Filipino', 'English', 'Mandarin', 'Japanese', 'Korean',
    'Food Safety', 'Hospitality Management', 'Event Planning', 'Tour Operations',
    'Criminal Investigation', 'Law Enforcement', 'Forensics', 'Legal Research',
];

$certifications = [
    'Civil Service Eligibility', 'PRC License', 'TESDA NC II', 'TESDA NC III',
    'CompTIA A+', 'CCNA', 'AWS Certified', 'Google Analytics Certified',
    'Project Management Professional (PMP)', 'Six Sigma Green Belt', 'ISO 9001 Auditor',
    'CPA Board Passer', 'Licensed Engineer', 'Licensed Teacher', 'Licensed Criminologist',
    'IELTS Certified', 'TOEFL Certified', 'First Aid/CPR Certified',
    'ISO 14001 Auditor', 'Microsoft Certified', 'Oracle Certified', 'Cisco Certified',
    'Google Cloud Certified', 'Certified Public Accountant',
    'Registered Mechanical Engineer', 'Registered Electrical Engineer',
    'Registered Electronics Engineer', 'Registered Civil Engineer',
    'DOLE Safety Officer Certificate', 'Philippine National Police Clearance',
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function weightedRandom(array $weightedItems): string {
    $total = array_sum($weightedItems);
    $rand = mt_rand(1, $total);
    $cumulative = 0;
    foreach ($weightedItems as $item => $weight) {
        $cumulative += $weight;
        if ($rand <= $cumulative) return (string)$item;
    }
    return (string)array_key_first($weightedItems);
}

function pickRandom(array $items) {
    return $items[array_rand($items)];
}

function pickRandomN(array $items, int $min, int $max): array {
    $n = mt_rand($min, min($max, count($items)));
    $keys = array_rand($items, $n);
    if (!is_array($keys)) $keys = [$keys];
    $result = [];
    foreach ($keys as $k) $result[] = $items[$k];
    return $result;
}

function generatePhone(): string {
    return '09' . str_pad(mt_rand(0, 999999999), 9, '0', STR_PAD_LEFT);
}

function generateStudentId(int $gradYear, int $seq, string $campusCode): string {
    return $gradYear . '-' . str_pad($seq, 5, '0', STR_PAD_LEFT) . '-' . $campusCode;
}

// ============================================================
// GENERATE ALUMNI
// ============================================================

echo "Generating $TARGET_ALUMNI alumni...\n";

$usedEmails = [];
$usedStudentIds = [];
$insertedCount = 0;

// Split: ~70% main campus, ~30% cavite
$mainCount = (int)round($TARGET_ALUMNI * 0.70);
$caviteCount = $TARGET_ALUMNI - $mainCount;

$userInsert = $pdo->prepare("INSERT INTO users (campus_id, name, email, password, role, status, email_verified_at, last_login_at, created_at, updated_at) VALUES (?, ?, ?, ?, 'alumni', ?, ?, ?, ?, ?)");

$profileInsert = $pdo->prepare("INSERT INTO alumni_profiles (
    user_id, campus_id, department_id, course_id, batch_id,
    first_name, last_name, middle_name, maiden_name, suffix,
    student_id, birth_date, age, gender, place_of_birth,
    civil_status, spouse_name, number_of_children,
    phone, mobile_no, alternate_email, current_address, city, state_province, postal_code, country,
    degree_program, major, graduation_year, enrollment_year, graduation_date,
    employment_status, job_level_position, presently_employed, employment_location_type,
    current_job_title, current_employer, company_address, company_industry,
    major_line_of_business, career_field, company_size,
    average_monthly_income, salary_range, salary_currency,
    job_start_date, date_hired, years_of_service,
    job_related_to_degree, job_aligned_to_course, job_mismatch_reason, job_satisfaction,
    unemployment_reason,
    skills, certifications, achievements, about_me, career_goals, feedback_to_institution,
    willing_to_mentor, willing_to_hire_alumni,
    profile_complete, profile_completed, profile_completed_at,
    survey_participation_count, last_profile_update,
    created_at, updated_at
) VALUES (
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?, ?,
    ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?,
    ?, ?, ?,
    ?, ?,
    ?, ?
)");

$pdo->beginTransaction();

try {
    $campusDistribution = [
        ['campus_id' => 1, 'courses' => $mainCourses, 'batches' => $mainBatches, 'code' => 'MAIN', 'count' => $mainCount],
        ['campus_id' => 2, 'courses' => $caviteCourses, 'batches' => $caviteBatches, 'code' => 'CAV', 'count' => $caviteCount],
    ];

    $seqCounters = [1 => [], 2 => []]; // per campus, per year

    foreach ($campusDistribution as $campus) {
        $campusId = $campus['campus_id'];
        $courses = $campus['courses'];
        $batches = $campus['batches'];
        $campusCode = $campus['code'];
        $count = $campus['count'];

        $courseIds = array_keys($courses);
        $batchIds = array_keys($batches);

        for ($i = 0; $i < $count; $i++) {
            // Pick gender
            $gender = weightedRandom($genders);

            // Pick name
            if ($gender === 'male') {
                $firstName = pickRandom($maleFirstNames);
            } elseif ($gender === 'female') {
                $firstName = pickRandom($femaleFirstNames);
            } else {
                $firstName = pickRandom(array_merge($maleFirstNames, $femaleFirstNames));
            }
            $lastName = pickRandom($lastNames);
            $middleName = pickRandom($middleNames);
            $suffix = pickRandom($suffixes);
            $maidenName = ($gender === 'female' && mt_rand(1, 100) <= 30) ? pickRandom($lastNames) : null;
            $fullName = trim("$firstName $middleName $lastName" . ($suffix ? " $suffix" : ''));

            // Generate unique email
            $emailBase = strtolower(str_replace([' ', '.'], '', $firstName)) . '.' . strtolower(str_replace([' ', '.'], '', $lastName));
            $email = $emailBase . mt_rand(100, 9999) . '@gmail.com';
            $attempts = 0;
            while (isset($usedEmails[$email]) && $attempts < 20) {
                $email = $emailBase . mt_rand(10000, 99999) . '@gmail.com';
                $attempts++;
            }
            $usedEmails[$email] = true;

            // Pick course & department
            $courseId = pickRandom($courseIds);
            $deptId = $courses[$courseId][0];
            $courseCode = $courses[$courseId][1];
            $courseName = $courses[$courseId][2];

            // Pick batch
            $batchId = pickRandom($batchIds);
            $gradYear = $batches[$batchId];
            $enrollYear = $gradYear - mt_rand(4, 5);

            // Student ID
            if (!isset($seqCounters[$campusId][$gradYear])) $seqCounters[$campusId][$gradYear] = 0;
            $seqCounters[$campusId][$gradYear]++;
            $studentId = generateStudentId($gradYear, $seqCounters[$campusId][$gradYear], $campusCode);

            // Birth date (graduated at ~21-25 years old)
            $birthYear = $gradYear - mt_rand(21, 26);
            $birthMonth = mt_rand(1, 12);
            $birthDay = mt_rand(1, 28);
            $birthDate = sprintf('%04d-%02d-%02d', $birthYear, $birthMonth, $birthDay);
            $age = 2025 - $birthYear;

            // Place of birth
            $placeOfBirth = pickRandom($cities) . ', ' . pickRandom($provinces);

            // Civil status
            $civilStatusIdx = weightedRandom(array_combine($civilStatuses, $civilStatusWeights));
            $civilStatus = $civilStatuses[(int)$civilStatusIdx];
            $spouseName = ($civilStatus === 'Married') ? pickRandom($maleFirstNames) . ' ' . pickRandom($lastNames) : null;
            $numChildren = ($civilStatus === 'Married') ? mt_rand(0, 4) : 0;

            // Contact
            $phone = generatePhone();
            $altEmail = (mt_rand(1, 100) <= 30) ? strtolower($firstName) . mt_rand(1, 999) . '@yahoo.com' : null;

            // Address
            $city = pickRandom($cities);
            $province = pickRandom($provinces);
            $address = mt_rand(1, 999) . ' ' . pickRandom(['Rizal', 'Mabini', 'Bonifacio', 'Quezon', 'Aguinaldo', 'Luna', 'Del Pilar', 'Lakandula', 'Lapu-Lapu', 'Magallanes', 'Burgos', 'Zamora', 'P. Gomez', 'M.H. Del Pilar', 'Gen. Luna', 'Tandang Sora', 'Katipunan', 'Dapitan', 'España', 'Taft']) . ' St., ' . pickRandom(['Brgy. San Antonio', 'Brgy. Sta. Cruz', 'Brgy. Poblacion', 'Brgy. Bagong Silang', 'Brgy. Maligaya', 'Brgy. Pag-asa', 'Brgy. Kamuning', 'Brgy. Commonwealth', 'Brgy. Tandang Sora', 'Brgy. San Jose']);
            $postalCode = (string)mt_rand(1000, 4999);

            // Employment
            $empStatus = weightedRandom($employmentStatuses);
            $isEmployed = in_array($empStatus, ['employed_full_time', 'employed_part_time', 'self_employed']);
            $presentlyEmployed = $isEmployed ? 'Yes' : 'No';

            // Career field (bias towards matching the course department)
            $careerField = null;
            $jobTitle = null;
            $employer = null;
            $companyAddr = null;
            $companyIndustry = null;
            $lineOfBusiness = null;
            $jobLevelPos = null;
            $avgMonthlyIncome = null;
            $salaryRange = null;
            $empLocationType = null;
            $companySize = null;
            $jobStartDate = null;
            $dateHired = null;
            $yearsOfService = null;
            $jobRelatedToDegree = null;
            $jobAlignedToCourse = null;
            $mismatchReason = null;
            $jobSatisfaction = null;
            $unemploymentReason = null;

            if ($isEmployed) {
                // Map department to likely career field
                $deptCareerMap = [
                    1  => 'marketing',      // Architecture & Fine Arts
                    2  => 'education',       // Arts & Sciences
                    3  => 'engineering',     // Engineering
                    4  => 'manufacturing',   // Industrial Technology
                    5  => 'education',       // Education
                    6  => 'business_management', // Business Admin
                    7  => 'hospitality',     // Hospitality & Tourism
                    8  => 'government',      // Criminal Justice
                    9  => 'education',       // Graduate School
                    10 => 'information_technology', // Computing Studies
                    26 => 'engineering',     // Engineering Cavite
                    27 => 'information_technology', // IT Cavite
                    28 => 'business_management', // Business Cavite
                    29 => 'education',       // Arts & Sciences Cavite
                    30 => 'education',       // Education Cavite
                ];

                // 65% of employed alumni work in field related to their department
                if (mt_rand(1, 100) <= 65 && isset($deptCareerMap[$deptId])) {
                    $careerField = $deptCareerMap[$deptId];
                } else {
                    $careerField = weightedRandom($careerFields);
                }

                $jobTitle = pickRandom($jobTitles[$careerField] ?? $jobTitles['other']);
                $employer = pickRandom($employers);
                $companyAddr = pickRandom($companyAddresses);

                // Career field to industry mapping
                $industryMap = [
                    'information_technology' => 'Information Technology',
                    'education' => 'Education',
                    'engineering' => 'Engineering & Construction',
                    'business_management' => 'Business Services',
                    'finance' => 'Banking & Finance',
                    'government' => 'Government & Public Administration',
                    'healthcare' => 'Healthcare',
                    'marketing' => 'Marketing & Advertising',
                    'hospitality' => 'Hospitality & Tourism',
                    'manufacturing' => 'Manufacturing',
                    'agriculture' => 'Agriculture',
                    'other' => 'Other',
                ];
                $companyIndustry = $industryMap[$careerField] ?? 'Other';

                // Line of business mapping
                $lobMap = [
                    'information_technology' => 'Information Tech./Arts',
                    'education' => 'Education',
                    'engineering' => 'Construction/Builder',
                    'business_management' => 'Business',
                    'finance' => 'Business',
                    'government' => 'Government',
                    'healthcare' => 'Others',
                    'marketing' => 'Business',
                    'hospitality' => 'Hotel/Restaurant',
                    'manufacturing' => 'Manufacturing',
                    'agriculture' => 'Others',
                    'other' => 'Others',
                ];
                $lineOfBusiness = $lobMap[$careerField] ?? 'Others';

                $jobLevelPos = weightedRandom(array_combine($jobLevelPositions, $jobLevelWeights));
                $jobLevelPos = $jobLevelPositions[(int)$jobLevelPos];
                $avgMonthlyIncome = weightedRandom($averageMonthlyIncomes);
                $salaryRange = weightedRandom($salaryRanges);
                $empLocationType = weightedRandom($employmentLocationTypes);
                $companySize = pickRandom($companySizes);

                // Job dates — realistic distribution:
                // 30% within 0-3 months, 35% within 3-9 months, 20% within 9-18 months, 10% within 18-24 months, 5% beyond 24 months
                $gradDateTs = strtotime(sprintf('%04d-%02d-15', $gradYear, mt_rand(3, 6)));
                $roll = mt_rand(1, 100);
                if ($roll <= 30) {
                    $daysAfterGrad = mt_rand(0, 90);       // 0-3 months
                } elseif ($roll <= 65) {
                    $daysAfterGrad = mt_rand(91, 270);     // 3-9 months
                } elseif ($roll <= 85) {
                    $daysAfterGrad = mt_rand(271, 540);    // 9-18 months
                } elseif ($roll <= 95) {
                    $daysAfterGrad = mt_rand(541, 730);    // 18-24 months
                } else {
                    $daysAfterGrad = mt_rand(731, 1095);   // 2-3 years
                }
                $hireTs = $gradDateTs + ($daysAfterGrad * 86400);
                // Don't place hire date in the future
                if ($hireTs > time()) $hireTs = time() - mt_rand(0, 180) * 86400;
                $dateHired = date('Y-m-d', $hireTs);
                $jobStartDate = $dateHired;
                $hireYear = (int)date('Y', $hireTs);
                $yearsOfService = round((time() - $hireTs) / (365.25 * 86400), 1);
                if ($yearsOfService < 0) $yearsOfService = 0;

                // Job alignment
                $aligned = isset($deptCareerMap[$deptId]) && $deptCareerMap[$deptId] === $careerField;
                $jobRelatedToDegree = $aligned ? 1 : 0;
                $jobAlignedToCourse = $aligned ? 'Yes' : 'No';
                $mismatchReason = $aligned ? 'none' : weightedRandom($jobMismatchReasons);
                $jobSatisfaction = mt_rand(1, 5);
            } else {
                $empLocationType = 'not_applicable';
                $salaryRange = null;

                if (in_array($empStatus, ['unemployed_seeking', 'unemployed_not_seeking'])) {
                    $unemploymentReason = pickRandom($unemploymentReasons);
                }
                if ($empStatus === 'continuing_education') {
                    $unemploymentReason = 'continuing_education';
                }
            }

            // Skills (3-8 random skills)
            $mySkills = pickRandomN($skills, 3, 8);

            // Certifications (0-4)
            $myCerts = (mt_rand(1, 100) <= 70) ? pickRandomN($certifications, 1, 4) : [];

            // Achievements
            $achievementPool = [
                "Dean's List", 'Cum Laude', 'Magna Cum Laude', 'Summa Cum Laude',
                'Best in Research', 'Outstanding Student Award', 'Leadership Award',
                'Community Service Award', 'Academic Excellence Award', 'Sports MVP',
                null, null, null, null, // nulls to make no-achievement common
            ];
            $achievement = pickRandom($achievementPool);

            // About me
            $aboutPool = [
                "A dedicated $courseName graduate passionate about career growth.",
                "Alumnus of EARIST with strong professional background.",
                "Committed to continuous learning and professional development.",
                "Experienced professional with skills in various domains.",
                null,
            ];
            $aboutMe = pickRandom($aboutPool);

            // Career goals
            $goalPool = [
                'Advance to senior leadership position within 5 years.',
                'Start my own business in the near future.',
                'Continue professional development and certifications.',
                'Transition to a role that better aligns with my passion.',
                'Contribute to nation-building through public service.',
                'Pursue graduate studies abroad.',
                null,
            ];
            $careerGoal = pickRandom($goalPool);

            // Feedback
            $feedbackPool = [
                'EARIST prepared me well for my career. Thank you!',
                'More industry partnerships would benefit current students.',
                'The alumni network should be stronger for job referrals.',
                'Excellent faculty and practical curriculum.',
                'More hands-on training and internship programs needed.',
                null, null,
            ];
            $feedback = pickRandom($feedbackPool);

            // Profile completeness
            $profileComplete = ($isEmployed && $achievement !== null) ? 1 : (mt_rand(1, 100) <= 75 ? 1 : 0);
            $willingToMentor = mt_rand(0, 1);
            $willingToHire = mt_rand(0, 1);

            // Timestamps
            $createdYear = mt_rand($gradYear, 2025);
            $createdMonth = mt_rand(1, 12);
            $createdDay = mt_rand(1, 28);
            $createdAt = sprintf('%04d-%02d-%02d %02d:%02d:%02d', 
                min($createdYear, 2025), $createdMonth, $createdDay,
                mt_rand(6, 23), mt_rand(0, 59), mt_rand(0, 59));
            $updatedAt = $createdAt; // same or later
            $emailVerifiedAt = $createdAt;

            // Last login (some recent, some old)
            $lastLoginDaysAgo = mt_rand(0, 365);
            $lastLoginTs = strtotime("-$lastLoginDaysAgo days");
            $lastLoginAt = date('Y-m-d H:i:s', $lastLoginTs);

            // Status distribution
            $statusWeights = ['active' => 80, 'inactive' => 10, 'pending' => 10];
            $status = weightedRandom($statusWeights);

            // Survey participation
            $surveyCount = mt_rand(0, 5);
            $profileCompletedAt = $profileComplete ? $createdAt : null;

            $gradDate = sprintf('%04d-%02d-15', $gradYear, mt_rand(3, 6)); // March-June graduation

            // ---- INSERT USER ----
            $userInsert->execute([
                $campusId,
                $fullName,
                $email,
                $DEFAULT_PASSWORD,
                $status,
                $emailVerifiedAt,
                $lastLoginAt,
                $createdAt,
                $updatedAt,
            ]);
            $userId = $pdo->lastInsertId();

            // ---- INSERT ALUMNI PROFILE ----
            $profileInsert->execute([
                $userId, $campusId, $deptId, $courseId, $batchId,
                $firstName, $lastName, $middleName, $maidenName, $suffix,
                $studentId, $birthDate, $age, $gender, $placeOfBirth,
                $civilStatus, $spouseName, $numChildren,
                $phone, $phone, $altEmail, $address, $city, $province, $postalCode, 'Philippines',
                $courseName, $courseCode, $gradYear, $enrollYear, $gradDate,
                $empStatus, $jobLevelPos, $presentlyEmployed, $empLocationType,
                $jobTitle, $employer, $companyAddr, $companyIndustry,
                $lineOfBusiness, $careerField, $companySize,
                $avgMonthlyIncome, $salaryRange, 'PHP',
                $jobStartDate, $dateHired, $yearsOfService,
                $jobRelatedToDegree, $jobAlignedToCourse, $mismatchReason, $jobSatisfaction,
                $unemploymentReason,
                json_encode($mySkills), json_encode($myCerts), $achievement, $aboutMe, $careerGoal, $feedback,
                $willingToMentor, $willingToHire,
                $profileComplete, $profileComplete, $profileCompletedAt,
                $surveyCount, $createdAt,
                $createdAt, $updatedAt,
            ]);

            $insertedCount++;

            if ($insertedCount % 100 === 0) {
                echo "  Inserted $insertedCount / $TARGET_ALUMNI...\n";
            }
        }
    }

    $pdo->commit();
    echo "\nDone! Inserted $insertedCount alumni.\n";

    // Summary stats
    echo "\n=== VERIFICATION ===\n";
    $stmt = $pdo->query("SELECT COUNT(*) as c FROM users WHERE role='alumni'");
    echo "Total alumni users: " . $stmt->fetch()['c'] . "\n";

    $stmt = $pdo->query("SELECT COUNT(*) as c FROM alumni_profiles");
    echo "Total alumni profiles: " . $stmt->fetch()['c'] . "\n";

    $stmt = $pdo->query("SELECT campus_id, COUNT(*) as c FROM users WHERE role='alumni' GROUP BY campus_id");
    echo "\nBy campus:\n";
    while ($r = $stmt->fetch()) echo "  Campus {$r['campus_id']}: {$r['c']}\n";

    $stmt = $pdo->query("SELECT employment_status, COUNT(*) as c FROM alumni_profiles GROUP BY employment_status ORDER BY c DESC");
    echo "\nBy employment status:\n";
    while ($r = $stmt->fetch()) echo "  {$r['employment_status']}: {$r['c']}\n";

    $stmt = $pdo->query("SELECT gender, COUNT(*) as c FROM alumni_profiles GROUP BY gender ORDER BY c DESC");
    echo "\nBy gender:\n";
    while ($r = $stmt->fetch()) echo "  {$r['gender']}: {$r['c']}\n";

    $stmt = $pdo->query("SELECT graduation_year, COUNT(*) as c FROM alumni_profiles GROUP BY graduation_year ORDER BY graduation_year");
    echo "\nBy graduation year:\n";
    while ($r = $stmt->fetch()) echo "  {$r['graduation_year']}: {$r['c']}\n";

    $stmt = $pdo->query("SELECT career_field, COUNT(*) as c FROM alumni_profiles WHERE career_field IS NOT NULL GROUP BY career_field ORDER BY c DESC");
    echo "\nBy career field:\n";
    while ($r = $stmt->fetch()) echo "  {$r['career_field']}: {$r['c']}\n";

    $stmt = $pdo->query("SELECT status, COUNT(*) as c FROM users WHERE role='alumni' GROUP BY status");
    echo "\nBy status:\n";
    while ($r = $stmt->fetch()) echo "  {$r['status']}: {$r['c']}\n";

} catch (Exception $e) {
    $pdo->rollBack();
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
