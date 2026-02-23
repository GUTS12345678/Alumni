<?php
/**
 * Generate a test Excel file with sample alumni data
 * matching the 2025 Alumni Directory template format.
 *
 * Columns: A=Last Name, B=First Name, C=Middle Name, D=Suffix,
 *          E=Student ID, F=Degree Program, G=Date of Birth,
 *          H=Current Address, I=Email, J=Phone, K=Gender
 */

require __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();
$sheet->setTitle('Alumni Directory');

// ── Row 1: School name ──
$sheet->mergeCells('A1:K1');
$sheet->setCellValue('A1', 'EULOGIO "AMANG" RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY');
$sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
$sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

// ── Row 2: Directory title (used for department auto-detection) ──
$sheet->mergeCells('A2:K2');
$sheet->setCellValue('A2', 'ALUMNI DIRECTORY - COLLEGE OF COMPUTING STUDIES 2025');
$sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);
$sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

// ── Row 3: Column headers ──
$headers = [
    'A3' => 'LAST NAME',
    'B3' => 'FIRST NAME',
    'C3' => 'MIDDLE NAME',
    'D3' => 'SUFFIX',
    'E3' => 'STUDENT ID',
    'F3' => 'DEGREE PROGRAM',
    'G3' => 'DATE OF BIRTH',
    'H3' => 'CURRENT ADDRESS',
    'I3' => 'EMAIL ADDRESS',
    'J3' => 'PHONE NUMBER',
    'K3' => 'GENDER',
];

foreach ($headers as $cell => $label) {
    $sheet->setCellValue($cell, $label);
}

$headerStyle = $sheet->getStyle('A3:K3');
$headerStyle->getFont()->setBold(true)->setSize(10);
$headerStyle->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('4472C4');
$headerStyle->getFont()->getColor()->setRGB('FFFFFF');
$headerStyle->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
$headerStyle->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

// ── Sample Alumni Data (20 rows) ──
$alumni = [
    ['Dela Cruz',   'Juan',      'Santos',    '',     '2020-00001', 'BS Information Technology',       '1998-03-15', '123 Rizal St, Manila',              'juan.delacruz@gmail.com',     '09171234567', 'Male'],
    ['Garcia',      'Maria',     'Lopez',     '',     '2020-00002', 'BS Computer Science',             '1999-07-22', '456 Mabini Ave, Quezon City',       'maria.garcia@yahoo.com',      '09181234568', 'Female'],
    ['Santos',      'Pedro',     'Reyes',     'Jr.',  '2020-00003', 'BS Information Systems',          '1997-11-08', '789 Bonifacio Blvd, Makati',        'pedro.santos@gmail.com',      '09191234569', 'Male'],
    ['Reyes',       'Ana',       'Mendoza',   '',     '2020-00004', 'BS Computer Science',             '2000-01-30', '321 Luna St, Pasig City',           'ana.reyes@outlook.com',       '09201234570', 'Female'],
    ['Li',          'Wei',       '',          '',     '2020-00005', 'BS Information Technology',       '1998-06-12', '654 Taft Ave, Manila',              '',                            '09211234571', 'Male'],
    ['Fernandez',   'Carlos',    'Aquino',    '',     '2020-00006', 'BS Computer Science',             '1999-09-05', '987 Espanya Blvd, Manila',          'carlos.fernandez@gmail.com',  '09221234572', 'Male'],
    ['Torres',      'Isabella',  'Cruz',      '',     '2020-00007', 'BS Information Technology',       '2000-04-18', '147 Quezon Ave, Caloocan',          'isabella.torres@yahoo.com',   '09231234573', 'Female'],
    ['Ramos',       'Miguel',    'Villanueva','III',  '2020-00008', 'BS Information Systems',          '1998-12-25', '258 Aurora Blvd, QC',               'miguel.ramos@gmail.com',      '09241234574', 'Male'],
    ['Bautista',    'Sofia',     'Castillo',  '',     '2020-00009', 'BS Information Technology',       '1999-02-14', '369 Shaw Blvd, Mandaluyong',        'sofia.bautista@gmail.com',    '09251234575', 'Female'],
    ['Rivera',      'Antonio',   'Pascual',   '',     '2020-00010', 'BS Computer Science',             '1997-08-20', '741 Ortigas Ave, Pasig',            'antonio.rivera@outlook.com',  '09261234576', 'Male'],
    ['Morales',     'Gabriela',  'Santiago',  '',     '2020-00011', 'BS Information Technology',       '2000-05-03', '852 EDSA, Makati',                  '',                            '09271234577', 'Female'],
    ['Villanueva',  'Rafael',    'Tan',       '',     '2020-00012', 'BS Information Systems',          '1998-10-17', '963 Roxas Blvd, Manila',            'rafael.villanueva@gmail.com', '09281234578', 'Male'],
    ['Castro',      'Carmen',    'Flores',    '',     '2020-00013', 'BS Computer Science',             '1999-06-28', '159 Commonwealth Ave, QC',          'carmen.castro@yahoo.com',     '',            'Female'],
    ['Mendoza',     'Jose',      'Lim',       'Sr.',  '2020-00014', 'BS Information Technology',       '1997-03-09', '267 Katipunan Ave, QC',             'jose.mendoza@gmail.com',      '09301234580', 'Male'],
    ['Gutierrez',   'Elena',     'Navarro',   '',     '2020-00015', 'BS Computer Science',             '2000-11-11', '375 C5 Road, Taguig',               'elena.gutierrez@outlook.com', '09311234581', 'Female'],
    ['Aquino',      'Marco',     'De Leon',   '',     '2020-00016', 'BS Information Systems',          '1998-07-04', '483 McKinley Rd, BGC',              'marco.aquino@gmail.com',      '09321234582', 'Male'],
    ['Pascual',     'Lucia',     'Abad',      '',     '2020-00017', 'BS Information Technology',       '1999-12-01', '591 Ayala Ave, Makati',             'lucia.pascual@yahoo.com',     '09331234583', 'Female'],
    ['Santiago',    'Diego',     'Roque',     '',     '2020-00018', 'BS Computer Science',             '1998-04-22', '608 Pasong Tamo, Makati',           '',                            '09341234584', 'Male'],
    ['Flores',      'Valentina', 'Ocampo',    '',     '2020-00019', 'BS Information Technology',       '2000-08-15', '716 Buendia Ave, Makati',           'valentina.flores@gmail.com',  '09351234585', 'Female'],
    ['De Leon',     'Andres',    'Manalo',    '',     '2020-00020', 'BS Information Systems',          '1997-01-28', '824 Gil Puyat Ave, Pasay',          'andres.deleon@outlook.com',   '09361234586', 'Male'],
];

$row = 4;
foreach ($alumni as $person) {
    $sheet->setCellValue("A{$row}", $person[0]);
    $sheet->setCellValue("B{$row}", $person[1]);
    $sheet->setCellValue("C{$row}", $person[2]);
    $sheet->setCellValue("D{$row}", $person[3]);
    $sheet->setCellValueExplicit("E{$row}", $person[4], \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
    $sheet->setCellValue("F{$row}", $person[5]);
    $sheet->setCellValue("G{$row}", $person[6]);
    $sheet->setCellValue("H{$row}", $person[7]);
    $sheet->setCellValue("I{$row}", $person[8]);
    $sheet->setCellValueExplicit("J{$row}", $person[9], \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
    $sheet->setCellValue("K{$row}", $person[10]);
    $row++;
}

// Style data rows
$lastDataRow = $row - 1;
$dataStyle = $sheet->getStyle("A4:K{$lastDataRow}");
$dataStyle->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
$dataStyle->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);

// Auto-size columns
foreach (range('A', 'K') as $col) {
    $sheet->getColumnDimension($col)->setAutoSize(true);
}

// ── Save ──
$outputPath = __DIR__ . '/../test_alumni_import.xlsx';
$writer = new Xlsx($spreadsheet);
$writer->save($outputPath);

$realPath = realpath($outputPath);
echo "✓ Created: {$realPath}\n";
echo "  Rows: " . count($alumni) . " alumni records\n";
echo "  Department hint: College of Computing Studies\n";
echo "  Programs: BSIT, BSCS, BSIS\n";
echo "  Edge cases:\n";
echo "    - 3 missing emails (rows 5, 11, 18) → placeholder emails\n";
echo "    - 1 missing phone (row 13)\n";
echo "    - 3 suffixes: Jr. (row 3), III (row 8), Sr. (row 14)\n";
echo "    - 1 short last name 'Li' (row 5) → password padding\n";
echo "    - 1 multi-word last name 'De Leon' (row 20)\n";
