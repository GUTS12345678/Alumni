-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 15, 2025 at 05:38 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `alumni_tracer_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `entity_type` varchar(255) DEFAULT NULL,
  `entity_id` bigint(20) UNSIGNED DEFAULT NULL,
  `description` text NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `description`, `metadata`, `ip_address`, `user_agent`, `created_at`, `updated_at`) VALUES
(1, 1, 'login', 'User', 1, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.4768', '2025-09-07 22:36:24', '2025-09-07 22:36:24'),
(2, 1, 'login', 'User', 1, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.4768', '2025-09-07 22:36:35', '2025-09-07 22:36:35'),
(3, 1, 'login', 'User', 1, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.4768', '2025-09-08 21:10:34', '2025-09-08 21:10:34'),
(4, 4, 'user_registered_via_survey', 'Survey', 1, 'Alumni registered via survey completion', '{\"response_id\":31}', '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', '2025-09-10 19:26:45', '2025-09-10 19:26:45'),
(5, 4, 'survey_completed', 'Survey', 1, 'Completed survey', '{\"response_id\":31}', '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', '2025-09-10 19:26:45', '2025-09-10 19:26:45'),
(6, 5, 'user_registered_via_survey', 'Survey', 1, 'Alumni registered via survey completion', '{\"response_id\":69}', '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', '2025-09-10 20:45:23', '2025-09-10 20:45:23'),
(7, 5, 'survey_completed', 'Survey', 1, 'Completed survey', '{\"response_id\":69}', '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', '2025-09-10 20:45:23', '2025-09-10 20:45:23');

-- --------------------------------------------------------

--
-- Table structure for table `admin_settings`
--

CREATE TABLE `admin_settings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `key` varchar(255) NOT NULL,
  `value` text DEFAULT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'string',
  `description` text DEFAULT NULL,
  `category` varchar(255) NOT NULL DEFAULT 'general',
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_settings`
--

INSERT INTO `admin_settings` (`id`, `key`, `value`, `type`, `description`, `category`, `is_public`, `created_at`, `updated_at`) VALUES
(1, 'site_name', 'Alumni Tracer System', 'string', 'Name of the application', 'general', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(2, 'institution_name', 'University Name', 'string', 'Name of the educational institution', 'general', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(3, 'contact_email', 'contact@university.edu', 'string', 'Contact email for alumni inquiries', 'general', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(4, 'email_from_name', 'Alumni Relations Office', 'string', 'Default sender name for emails', 'email', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(5, 'email_from_address', 'alumni@university.edu', 'string', 'Default sender email address', 'email', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(6, 'enable_email_reminders', 'true', 'boolean', 'Enable automatic email reminders', 'email', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(7, 'reminder_interval_days', '7', 'integer', 'Days between reminder emails', 'email', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(8, 'max_reminders', '3', 'integer', 'Maximum number of reminder emails to send', 'email', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(9, 'default_survey_duration_days', '30', 'integer', 'Default duration for surveys in days', 'survey', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(10, 'allow_anonymous_responses', 'false', 'boolean', 'Allow anonymous survey responses', 'survey', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(11, 'require_profile_completion', 'true', 'boolean', 'Require profile completion after registration', 'survey', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(12, 'maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', 'system', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(13, 'data_retention_years', '10', 'integer', 'Years to retain alumni data', 'system', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(14, 'enable_activity_logging', 'true', 'boolean', 'Enable user activity logging', 'system', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18');

-- --------------------------------------------------------

--
-- Table structure for table `alumni_profiles`
--

CREATE TABLE `alumni_profiles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `batch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `student_id` varchar(255) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` enum('male','female','other','prefer_not_to_say') DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `alternate_email` varchar(255) DEFAULT NULL,
  `current_address` text DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state_province` varchar(255) DEFAULT NULL,
  `postal_code` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `degree_program` varchar(255) DEFAULT NULL,
  `major` varchar(255) DEFAULT NULL,
  `minor` varchar(255) DEFAULT NULL,
  `gpa` decimal(3,2) DEFAULT NULL,
  `graduation_year` year(4) DEFAULT NULL,
  `graduation_date` date DEFAULT NULL,
  `employment_status` enum('employed_full_time','employed_part_time','self_employed','unemployed_seeking','unemployed_not_seeking','continuing_education','military_service','other') DEFAULT NULL,
  `current_job_title` varchar(255) DEFAULT NULL,
  `current_employer` varchar(255) DEFAULT NULL,
  `company_industry` varchar(255) DEFAULT NULL,
  `company_size` varchar(255) DEFAULT NULL,
  `current_salary` decimal(10,2) DEFAULT NULL,
  `salary_currency` varchar(3) NOT NULL DEFAULT 'USD',
  `job_start_date` date DEFAULT NULL,
  `job_description` text DEFAULT NULL,
  `job_related_to_degree` tinyint(1) DEFAULT NULL,
  `skills` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`skills`)),
  `certifications` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`certifications`)),
  `career_goals` text DEFAULT NULL,
  `feedback_to_institution` text DEFAULT NULL,
  `willing_to_mentor` tinyint(1) NOT NULL DEFAULT 0,
  `willing_to_hire_alumni` tinyint(1) NOT NULL DEFAULT 0,
  `profile_completed` tinyint(1) NOT NULL DEFAULT 0,
  `profile_completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `alumni_profiles`
--

INSERT INTO `alumni_profiles` (`id`, `user_id`, `batch_id`, `first_name`, `last_name`, `middle_name`, `student_id`, `birth_date`, `gender`, `phone`, `alternate_email`, `current_address`, `city`, `state_province`, `postal_code`, `country`, `degree_program`, `major`, `minor`, `gpa`, `graduation_year`, `graduation_date`, `employment_status`, `current_job_title`, `current_employer`, `company_industry`, `company_size`, `current_salary`, `salary_currency`, `job_start_date`, `job_description`, `job_related_to_degree`, `skills`, `certifications`, `career_goals`, `feedback_to_institution`, `willing_to_mentor`, `willing_to_hire_alumni`, `profile_completed`, `profile_completed_at`, `created_at`, `updated_at`) VALUES
(1, 4, NULL, 'Adrian', 'Nacu', NULL, '224-12536M', '2005-05-06', 'male', '09763211128', NULL, 'Test', 'Test', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 1.50, '2025', NULL, 'employed_full_time', 'Senior Software Developer', 'ARUP', NULL, NULL, 100000.00, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-09-10 19:26:45', '2025-09-10 19:26:45', '2025-09-10 19:26:45'),
(2, 5, 5, 'Test', 'Test', NULL, '224-123456M', '2008-05-13', 'male', '09763211128', NULL, 'Test', 'Test', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 1.00, '2024', NULL, 'employed_full_time', 'Senior Software Developer', 'ARUP', NULL, NULL, 100000.00, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-09-10 20:45:22', '2025-09-10 20:45:22', '2025-09-10 20:45:22');

-- --------------------------------------------------------

--
-- Table structure for table `batches`
--

CREATE TABLE `batches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `graduation_year` year(4) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `batches`
--

INSERT INTO `batches` (`id`, `name`, `graduation_year`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Class of 2020', '2020', 'Graduated during COVID-19 pandemic', 'active', '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(2, 'Class of 2021', '2021', 'First hybrid graduation ceremony', 'active', '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(3, 'Class of 2022', '2022', 'Return to in-person ceremonies', 'active', '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(4, 'Class of 2023', '2023', 'Record enrollment year', 'active', '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(5, 'Class of 2024', '2024', 'Most recent graduates', 'active', '2025-09-07 22:32:18', '2025-09-07 22:32:18');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000001_create_cache_table', 1),
(2, '0001_01_01_000002_create_jobs_table', 1),
(3, '2024_01_01_000003_create_users_table', 1),
(4, '2024_01_01_000004_create_batches_table', 1),
(5, '2024_01_01_000005_create_alumni_profiles_table', 1),
(6, '2024_01_01_000006_create_surveys_table', 1),
(7, '2024_01_01_000007_create_survey_questions_table', 1),
(8, '2024_01_01_000008_create_survey_responses_table', 1),
(9, '2024_01_01_000009_create_survey_answers_table', 1),
(10, '2024_01_01_000010_create_survey_invitations_table', 1),
(11, '2024_01_01_000011_create_admin_settings_table', 1),
(12, '2024_01_01_000012_create_activity_logs_table', 1),
(13, '2025_08_16_044433_create_personal_access_tokens_table', 1),
(14, '2025_09_09_235227_add_name_to_users_table', 2),
(16, '2025_09_10_065519_add_name_to_users_table', 3);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'auth-token', '28b7099c2bd87b6c69a88d61b93fa48d1a0f0a39c27d132f0562b2df3352bd00', '[\"*\"]', NULL, NULL, '2025-09-07 22:36:24', '2025-09-07 22:36:24'),
(2, 'App\\Models\\User', 1, 'auth-token', '1ecb787efa3010df6e65cbdba518d24dbefb6873036b905aa3bdd4472a3f785b', '[\"*\"]', '2025-09-07 22:38:38', NULL, '2025-09-07 22:36:35', '2025-09-07 22:38:38'),
(3, 'App\\Models\\User', 1, 'auth-token', '0b09ede0fdc1fc12b34f961b917d3e72e41fc22141f9eeb9128aa93bbeee0387', '[\"*\"]', NULL, NULL, '2025-09-08 21:10:34', '2025-09-08 21:10:34'),
(4, 'App\\Models\\User', 4, 'auth-token', '5761e79af6788c664987ec4486384ee38776c6b0d5aca9736698f2ea9031be73', '[\"*\"]', NULL, NULL, '2025-09-10 19:26:45', '2025-09-10 19:26:45'),
(5, 'App\\Models\\User', 5, 'auth-token', '46c45fd9b7252ac1fd5e28a3578d7f28f18b1590ec5f0c6439351428d911b5a6', '[\"*\"]', '2025-09-14 04:51:16', NULL, '2025-09-10 20:45:23', '2025-09-14 04:51:16');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('oM1DnDQckufQtR5z2hXrHsZzTHWCrcnnwKsfU7hM', 7, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoiR1EwSmluN0pqdlJ6V0NzQm44RGR0YmJoZGNkbDdRUWhuQUw4UlFzVyI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fXM6NTA6ImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjtpOjc7fQ==', 1757904892),
('yL0pIowrimfTATEtiq86acElXIE7479fWMzfzi4j', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiakthNVR0V2EzNERmdmRBdEZiV3QyZFRMeld4Uk45dnE4aFExcFFxSCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1757907082);

-- --------------------------------------------------------

--
-- Table structure for table `surveys`
--

CREATE TABLE `surveys` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `status` enum('draft','active','inactive','archived') NOT NULL DEFAULT 'draft',
  `type` enum('registration','follow_up','annual','custom') NOT NULL DEFAULT 'registration',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `target_batches` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_batches`)),
  `target_graduation_years` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_graduation_years`)),
  `is_anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `allow_multiple_responses` tinyint(1) NOT NULL DEFAULT 0,
  `require_authentication` tinyint(1) NOT NULL DEFAULT 1,
  `is_registration_survey` tinyint(1) NOT NULL DEFAULT 0,
  `email_subject` varchar(255) DEFAULT NULL,
  `email_body` text DEFAULT NULL,
  `send_reminder_emails` tinyint(1) NOT NULL DEFAULT 0,
  `reminder_interval_days` int(11) NOT NULL DEFAULT 7,
  `total_sent` int(11) NOT NULL DEFAULT 0,
  `total_responses` int(11) NOT NULL DEFAULT 0,
  `response_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `surveys`
--

INSERT INTO `surveys` (`id`, `title`, `description`, `instructions`, `status`, `type`, `start_date`, `end_date`, `target_batches`, `target_graduation_years`, `is_anonymous`, `allow_multiple_responses`, `require_authentication`, `is_registration_survey`, `email_subject`, `email_body`, `send_reminder_emails`, `reminder_interval_days`, `total_sent`, `total_responses`, `response_rate`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Alumni Registration & Initial Survey', 'Welcome! This survey helps us collect your information and track your career progress.', 'Please fill out all required fields. This information will be used to create your alumni profile.', 'active', 'registration', NULL, NULL, NULL, NULL, 0, 0, 0, 1, 'Complete Your Alumni Registration', 'Dear Alumni, Please complete your registration by clicking the link below.', 0, 7, 0, 2, 0.00, 1, '2025-09-07 22:32:18', '2025-09-10 20:45:23');

-- --------------------------------------------------------

--
-- Table structure for table `survey_answers`
--

CREATE TABLE `survey_answers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `survey_response_id` bigint(20) UNSIGNED NOT NULL,
  `survey_question_id` bigint(20) UNSIGNED NOT NULL,
  `answer_text` text DEFAULT NULL,
  `answer_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`answer_json`)),
  `answer_number` decimal(15,4) DEFAULT NULL,
  `answer_date` date DEFAULT NULL,
  `answer_boolean` tinyint(1) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_type` varchar(255) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `answered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `time_spent_seconds` int(11) DEFAULT NULL,
  `is_skipped` tinyint(1) NOT NULL DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `survey_answers`
--

INSERT INTO `survey_answers` (`id`, `survey_response_id`, `survey_question_id`, `answer_text`, `answer_json`, `answer_number`, `answer_date`, `answer_boolean`, `file_path`, `file_name`, `file_type`, `file_size`, `answered_at`, `time_spent_seconds`, `is_skipped`, `notes`, `created_at`, `updated_at`) VALUES
(1, 17, 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:28:50', NULL, 1, NULL, '2025-09-10 02:28:50', '2025-09-10 02:28:50'),
(2, 17, 6, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:28:50', NULL, 1, NULL, '2025-09-10 02:28:50', '2025-09-10 02:28:50'),
(3, 17, 7, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:28:51', NULL, 1, NULL, '2025-09-10 02:28:51', '2025-09-10 02:28:51'),
(4, 17, 11, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:28:51', NULL, 1, NULL, '2025-09-10 02:28:51', '2025-09-10 02:28:51'),
(5, 17, 13, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:28:52', NULL, 1, NULL, '2025-09-10 02:28:52', '2025-09-10 02:28:52'),
(6, 17, 14, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:28:52', NULL, 1, NULL, '2025-09-10 02:28:52', '2025-09-10 02:28:52'),
(7, 17, 15, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:28:52', NULL, 1, NULL, '2025-09-10 02:28:52', '2025-09-10 02:28:52'),
(8, 17, 16, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:28:52', NULL, 1, NULL, '2025-09-10 02:28:52', '2025-09-10 02:28:52'),
(9, 17, 17, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:28:53', NULL, 1, NULL, '2025-09-10 02:28:53', '2025-09-10 02:28:53'),
(10, 17, 18, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:28:53', NULL, 1, NULL, '2025-09-10 02:28:53', '2025-09-10 02:28:53'),
(11, 17, 19, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:28:53', NULL, 1, NULL, '2025-09-10 02:28:53', '2025-09-10 02:28:53'),
(12, 17, 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:28:53', NULL, 1, NULL, '2025-09-10 02:28:53', '2025-09-10 02:28:53'),
(13, 26, 1, 'Adrian', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:44:55', NULL, 0, NULL, '2025-09-10 02:44:55', '2025-09-10 02:44:55'),
(14, 26, 2, 'Nacu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:44:56', NULL, 0, NULL, '2025-09-10 02:44:56', '2025-09-10 02:44:56'),
(15, 26, 3, '224-12536M', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:44:56', NULL, 0, NULL, '2025-09-10 02:44:56', '2025-09-10 02:44:56'),
(16, 26, 4, 'nacu.a.bscs@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:07', NULL, 0, NULL, '2025-09-10 02:44:57', '2025-09-10 02:45:07'),
(17, 26, 5, '09763211128', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:44:57', NULL, 0, NULL, '2025-09-10 02:44:57', '2025-09-10 02:44:57'),
(18, 26, 6, NULL, NULL, NULL, '2004-05-06', NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:44:58', NULL, 0, NULL, '2025-09-10 02:44:58', '2025-09-10 02:44:58'),
(19, 26, 7, 'Male', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:44:58', NULL, 0, NULL, '2025-09-10 02:44:58', '2025-09-10 02:44:58'),
(20, 26, 8, 'Bachelor of Science In Computer Science', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:44:59', NULL, 0, NULL, '2025-09-10 02:44:59', '2025-09-10 02:44:59'),
(21, 26, 9, 'N/A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:44:59', NULL, 0, NULL, '2025-09-10 02:44:59', '2025-09-10 02:44:59'),
(22, 26, 10, NULL, NULL, 2022.0000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:00', NULL, 0, NULL, '2025-09-10 02:45:00', '2025-09-10 02:45:00'),
(23, 26, 11, NULL, NULL, 1.5500, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:00', NULL, 0, NULL, '2025-09-10 02:45:00', '2025-09-10 02:45:00'),
(24, 26, 12, 'Employed Full-time', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:01', NULL, 0, NULL, '2025-09-10 02:45:01', '2025-09-10 02:45:01'),
(25, 26, 13, 'Senior Software Developer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:01', NULL, 0, NULL, '2025-09-10 02:45:01', '2025-09-10 02:45:01'),
(26, 26, 14, 'ARUP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:02', NULL, 0, NULL, '2025-09-10 02:45:02', '2025-09-10 02:45:02'),
(27, 26, 15, NULL, NULL, 100000.0000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:03', NULL, 0, NULL, '2025-09-10 02:45:03', '2025-09-10 02:45:03'),
(28, 26, 16, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:03', NULL, 0, NULL, '2025-09-10 02:45:03', '2025-09-10 02:45:03'),
(29, 26, 17, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:04', NULL, 0, NULL, '2025-09-10 02:45:04', '2025-09-10 02:45:04'),
(30, 26, 18, 'Philippines', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:04', NULL, 0, NULL, '2025-09-10 02:45:04', '2025-09-10 02:45:04'),
(31, 26, 19, 'No', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:05', NULL, 0, NULL, '2025-09-10 02:45:05', '2025-09-10 02:45:05'),
(32, 26, 20, 'N/A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:06', NULL, 0, NULL, '2025-09-10 02:45:06', '2025-09-10 02:45:06'),
(33, 26, 21, 'NACU', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:06', NULL, 0, NULL, '2025-09-10 02:45:06', '2025-09-10 02:45:06'),
(34, 26, 22, 'NACU', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 02:45:07', NULL, 0, NULL, '2025-09-10 02:45:07', '2025-09-10 02:45:07'),
(35, 28, 1, 'Adrian', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:33', NULL, 0, NULL, '2025-09-10 19:17:33', '2025-09-10 19:17:33'),
(36, 28, 2, 'Nacu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:34', NULL, 0, NULL, '2025-09-10 19:17:34', '2025-09-10 19:17:34'),
(37, 28, 3, '224-12536M', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:34', NULL, 0, NULL, '2025-09-10 19:17:34', '2025-09-10 19:17:34'),
(38, 28, 4, 'nacu.a.bscs@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:38', NULL, 0, NULL, '2025-09-10 19:17:34', '2025-09-10 19:17:38'),
(39, 28, 5, '09763211128', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:34', NULL, 0, NULL, '2025-09-10 19:17:34', '2025-09-10 19:17:34'),
(40, 28, 6, NULL, NULL, NULL, '2004-05-06', NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:34', NULL, 0, NULL, '2025-09-10 19:17:34', '2025-09-10 19:17:34'),
(41, 28, 7, 'Male', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:35', NULL, 0, NULL, '2025-09-10 19:17:35', '2025-09-10 19:17:35'),
(42, 28, 8, 'Bachelor of Science In Computer Science', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:35', NULL, 0, NULL, '2025-09-10 19:17:35', '2025-09-10 19:17:35'),
(43, 28, 9, 'N/A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:35', NULL, 0, NULL, '2025-09-10 19:17:35', '2025-09-10 19:17:35'),
(44, 28, 10, NULL, NULL, 2024.0000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:35', NULL, 0, NULL, '2025-09-10 19:17:35', '2025-09-10 19:17:35'),
(45, 28, 11, NULL, NULL, 1.5600, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:36', NULL, 0, NULL, '2025-09-10 19:17:36', '2025-09-10 19:17:36'),
(46, 28, 12, 'Employed Full-time', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:36', NULL, 0, NULL, '2025-09-10 19:17:36', '2025-09-10 19:17:36'),
(47, 28, 13, 'Senior Software Developer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:36', NULL, 0, NULL, '2025-09-10 19:17:36', '2025-09-10 19:17:36'),
(48, 28, 14, 'ARUP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:36', NULL, 0, NULL, '2025-09-10 19:17:36', '2025-09-10 19:17:36'),
(49, 28, 15, NULL, NULL, 100000.0000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:36', NULL, 0, NULL, '2025-09-10 19:17:36', '2025-09-10 19:17:36'),
(50, 28, 16, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:37', NULL, 0, NULL, '2025-09-10 19:17:37', '2025-09-10 19:17:37'),
(51, 28, 17, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:37', NULL, 0, NULL, '2025-09-10 19:17:37', '2025-09-10 19:17:37'),
(52, 28, 18, 'Philippines', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:37', NULL, 0, NULL, '2025-09-10 19:17:37', '2025-09-10 19:17:37'),
(53, 28, 19, 'No', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:37', NULL, 0, NULL, '2025-09-10 19:17:37', '2025-09-10 19:17:37'),
(54, 28, 20, 'N/A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:38', NULL, 0, NULL, '2025-09-10 19:17:38', '2025-09-10 19:17:38'),
(55, 28, 21, 'Nacu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:38', NULL, 0, NULL, '2025-09-10 19:17:38', '2025-09-10 19:17:38'),
(56, 28, 22, 'Nacu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:17:38', NULL, 0, NULL, '2025-09-10 19:17:38', '2025-09-10 19:17:38'),
(57, 31, 1, 'Adrian', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:32', NULL, 0, NULL, '2025-09-10 19:26:32', '2025-09-10 19:26:32'),
(58, 31, 2, 'Nacu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:32', NULL, 0, NULL, '2025-09-10 19:26:32', '2025-09-10 19:26:32'),
(59, 31, 3, '224-12536M', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:33', NULL, 0, NULL, '2025-09-10 19:26:33', '2025-09-10 19:26:33'),
(60, 31, 4, 'nacu.a.bscs@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:43', NULL, 0, NULL, '2025-09-10 19:26:33', '2025-09-10 19:26:43'),
(61, 31, 5, '09763211128', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:34', NULL, 0, NULL, '2025-09-10 19:26:34', '2025-09-10 19:26:34'),
(62, 31, 6, NULL, NULL, NULL, '2005-05-06', NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:34', NULL, 0, NULL, '2025-09-10 19:26:34', '2025-09-10 19:26:34'),
(63, 31, 7, 'Male', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:35', NULL, 0, NULL, '2025-09-10 19:26:35', '2025-09-10 19:26:35'),
(64, 31, 8, 'Bachelor of Science In Computer Science', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:35', NULL, 0, NULL, '2025-09-10 19:26:35', '2025-09-10 19:26:35'),
(65, 31, 9, 'N/A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:36', NULL, 0, NULL, '2025-09-10 19:26:36', '2025-09-10 19:26:36'),
(66, 31, 10, NULL, NULL, 2025.0000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:37', NULL, 0, NULL, '2025-09-10 19:26:37', '2025-09-10 19:26:37'),
(67, 31, 11, NULL, NULL, 1.5000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:37', NULL, 0, NULL, '2025-09-10 19:26:37', '2025-09-10 19:26:37'),
(68, 31, 12, 'Employed Full-time', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:38', NULL, 0, NULL, '2025-09-10 19:26:38', '2025-09-10 19:26:38'),
(69, 31, 13, 'Senior Software Developer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:38', NULL, 0, NULL, '2025-09-10 19:26:38', '2025-09-10 19:26:38'),
(70, 31, 14, 'ARUP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:39', NULL, 0, NULL, '2025-09-10 19:26:39', '2025-09-10 19:26:39'),
(71, 31, 15, NULL, NULL, 100000.0000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:39', NULL, 0, NULL, '2025-09-10 19:26:39', '2025-09-10 19:26:39'),
(72, 31, 16, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:40', NULL, 0, NULL, '2025-09-10 19:26:40', '2025-09-10 19:26:40'),
(73, 31, 17, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:40', NULL, 0, NULL, '2025-09-10 19:26:40', '2025-09-10 19:26:40'),
(74, 31, 18, 'Philippines', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:41', NULL, 0, NULL, '2025-09-10 19:26:41', '2025-09-10 19:26:41'),
(75, 31, 19, 'No', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:41', NULL, 0, NULL, '2025-09-10 19:26:41', '2025-09-10 19:26:41'),
(76, 31, 20, 'N/A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:42', NULL, 0, NULL, '2025-09-10 19:26:42', '2025-09-10 19:26:42'),
(77, 31, 21, 'Nacu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:42', NULL, 0, NULL, '2025-09-10 19:26:42', '2025-09-10 19:26:42'),
(78, 31, 22, 'Nacu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 19:26:43', NULL, 0, NULL, '2025-09-10 19:26:43', '2025-09-10 19:26:43'),
(79, 69, 1, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:06', NULL, 0, NULL, '2025-09-10 20:45:06', '2025-09-10 20:45:06'),
(80, 69, 2, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:06', NULL, 0, NULL, '2025-09-10 20:45:06', '2025-09-10 20:45:06'),
(81, 69, 3, '224-123456M', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:07', NULL, 0, NULL, '2025-09-10 20:45:07', '2025-09-10 20:45:07'),
(82, 69, 4, 'test@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:20', NULL, 0, NULL, '2025-09-10 20:45:08', '2025-09-10 20:45:20'),
(83, 69, 5, '09763211128', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:09', NULL, 0, NULL, '2025-09-10 20:45:09', '2025-09-10 20:45:09'),
(84, 69, 6, NULL, NULL, NULL, '2008-05-13', NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:09', NULL, 0, NULL, '2025-09-10 20:45:09', '2025-09-10 20:45:09'),
(85, 69, 7, 'Male', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:10', NULL, 0, NULL, '2025-09-10 20:45:10', '2025-09-10 20:45:10'),
(86, 69, 8, 'Bachelor of Science In Computer Science', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:10', NULL, 0, NULL, '2025-09-10 20:45:10', '2025-09-10 20:45:10'),
(87, 69, 9, 'N/A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:11', NULL, 0, NULL, '2025-09-10 20:45:11', '2025-09-10 20:45:11'),
(88, 69, 10, NULL, NULL, 2024.0000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:12', NULL, 0, NULL, '2025-09-10 20:45:12', '2025-09-10 20:45:12'),
(89, 69, 11, NULL, NULL, 1.0000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:13', NULL, 0, NULL, '2025-09-10 20:45:13', '2025-09-10 20:45:13'),
(90, 69, 12, 'Employed Full-time', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:14', NULL, 0, NULL, '2025-09-10 20:45:14', '2025-09-10 20:45:14'),
(91, 69, 13, 'Senior Software Developer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:14', NULL, 0, NULL, '2025-09-10 20:45:14', '2025-09-10 20:45:14'),
(92, 69, 14, 'ARUP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:15', NULL, 0, NULL, '2025-09-10 20:45:15', '2025-09-10 20:45:15'),
(93, 69, 15, NULL, NULL, 100000.0000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:16', NULL, 0, NULL, '2025-09-10 20:45:16', '2025-09-10 20:45:16'),
(94, 69, 16, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:16', NULL, 0, NULL, '2025-09-10 20:45:16', '2025-09-10 20:45:16'),
(95, 69, 17, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:17', NULL, 0, NULL, '2025-09-10 20:45:17', '2025-09-10 20:45:17'),
(96, 69, 18, 'Philippines', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:17', NULL, 0, NULL, '2025-09-10 20:45:17', '2025-09-10 20:45:17'),
(97, 69, 19, 'No', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:18', NULL, 0, NULL, '2025-09-10 20:45:18', '2025-09-10 20:45:18'),
(98, 69, 20, 'Nacu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:18', NULL, 0, NULL, '2025-09-10 20:45:18', '2025-09-10 20:45:18'),
(99, 69, 21, 'Nacu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:19', NULL, 0, NULL, '2025-09-10 20:45:19', '2025-09-10 20:45:19'),
(100, 69, 22, 'Nacu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:20', NULL, 0, NULL, '2025-09-10 20:45:20', '2025-09-10 20:45:20');

-- --------------------------------------------------------

--
-- Table structure for table `survey_invitations`
--

CREATE TABLE `survey_invitations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `survey_id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `student_id` varchar(255) DEFAULT NULL,
  `batch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `invitation_token` varchar(255) NOT NULL,
  `status` enum('pending','sent','opened','clicked','responded','bounced','unsubscribed') NOT NULL DEFAULT 'pending',
  `sent_at` timestamp NULL DEFAULT NULL,
  `opened_at` timestamp NULL DEFAULT NULL,
  `clicked_at` timestamp NULL DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `reminder_count` int(11) NOT NULL DEFAULT 0,
  `last_reminder_sent` timestamp NULL DEFAULT NULL,
  `email_message_id` varchar(255) DEFAULT NULL,
  `email_metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`email_metadata`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_questions`
--

CREATE TABLE `survey_questions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `survey_id` bigint(20) UNSIGNED NOT NULL,
  `question_text` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `question_type` enum('text','textarea','email','phone','number','date','single_choice','multiple_choice','dropdown','checkbox','rating','file_upload','matrix') NOT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `validation_rules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`validation_rules`)),
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `conditional_logic` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`conditional_logic`)),
  `matrix_rows` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`matrix_rows`)),
  `matrix_columns` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`matrix_columns`)),
  `rating_min` int(11) DEFAULT NULL,
  `rating_max` int(11) DEFAULT NULL,
  `rating_min_label` varchar(255) DEFAULT NULL,
  `rating_max_label` varchar(255) DEFAULT NULL,
  `placeholder` varchar(255) DEFAULT NULL,
  `help_text` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `survey_questions`
--

INSERT INTO `survey_questions` (`id`, `survey_id`, `question_text`, `description`, `question_type`, `options`, `validation_rules`, `is_required`, `order`, `is_active`, `conditional_logic`, `matrix_rows`, `matrix_columns`, `rating_min`, `rating_max`, `rating_min_label`, `rating_max_label`, `placeholder`, `help_text`, `created_at`, `updated_at`) VALUES
(1, 1, 'First Name', NULL, 'text', NULL, NULL, 1, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(2, 1, 'Last Name', NULL, 'text', NULL, NULL, 1, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(3, 1, 'Student ID', NULL, 'text', NULL, NULL, 1, 3, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(4, 1, 'Email Address', NULL, 'email', NULL, NULL, 1, 4, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(5, 1, 'Phone Number', NULL, 'phone', NULL, NULL, 0, 5, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(6, 1, 'Date of Birth', NULL, 'date', NULL, NULL, 0, 6, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(7, 1, 'Gender', NULL, 'single_choice', '[\"Male\",\"Female\",\"Other\",\"Prefer not to say\"]', NULL, 0, 7, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(8, 1, 'Degree Program', NULL, 'text', NULL, NULL, 1, 8, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(9, 1, 'Major', NULL, 'text', NULL, NULL, 1, 9, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(10, 1, 'Graduation Year', NULL, 'number', NULL, NULL, 1, 10, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(11, 1, 'GPA', NULL, 'number', NULL, NULL, 0, 11, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(12, 1, 'Current Employment Status', NULL, 'single_choice', '[\"Employed Full-time\",\"Employed Part-time\",\"Self-employed\",\"Unemployed (seeking work)\",\"Unemployed (not seeking work)\",\"Continuing Education\",\"Military Service\",\"Other\"]', NULL, 1, 12, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(13, 1, 'Current Job Title', NULL, 'text', NULL, NULL, 0, 13, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(14, 1, 'Current Employer', NULL, 'text', NULL, NULL, 0, 14, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(15, 1, 'Annual Salary (Optional)', NULL, 'number', NULL, NULL, 0, 15, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(16, 1, 'Current Address', NULL, 'textarea', NULL, NULL, 0, 16, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(17, 1, 'City', NULL, 'text', NULL, NULL, 0, 17, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(18, 1, 'Country', NULL, 'text', NULL, NULL, 0, 18, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(19, 1, 'Are you willing to mentor current students?', NULL, 'single_choice', '[\"Yes\",\"No\",\"Maybe\"]', NULL, 0, 19, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(20, 1, 'Additional Comments or Feedback', NULL, 'textarea', NULL, NULL, 0, 20, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(21, 1, 'Create Password', 'This will be used to log into your alumni portal', 'text', NULL, NULL, 1, 21, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(22, 1, 'Confirm Password', NULL, 'text', NULL, NULL, 1, 22, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18');

-- --------------------------------------------------------

--
-- Table structure for table `survey_responses`
--

CREATE TABLE `survey_responses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `survey_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `response_token` varchar(255) NOT NULL,
  `status` enum('in_progress','completed','abandoned') NOT NULL DEFAULT 'in_progress',
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  `last_updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `respondent_email` varchar(255) DEFAULT NULL,
  `respondent_name` varchar(255) DEFAULT NULL,
  `respondent_student_id` varchar(255) DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `browser_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`browser_info`)),
  `total_questions` int(11) NOT NULL DEFAULT 0,
  `answered_questions` int(11) NOT NULL DEFAULT 0,
  `completion_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `time_spent_seconds` int(11) DEFAULT NULL,
  `is_valid_response` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `survey_responses`
--

INSERT INTO `survey_responses` (`id`, `survey_id`, `user_id`, `response_token`, `status`, `started_at`, `completed_at`, `last_updated_at`, `respondent_email`, `respondent_name`, `respondent_student_id`, `ip_address`, `user_agent`, `browser_info`, `total_questions`, `answered_questions`, `completion_percentage`, `time_spent_seconds`, `is_valid_response`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 'stpyCbxVHXblp5vamzcuO6RUMptvTZQi1iQIz5xR', 'in_progress', '2025-09-08 21:25:25', NULL, '2025-09-09 05:25:25', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.4768', NULL, 22, 0, 0.00, NULL, 1, '2025-09-08 21:25:25', '2025-09-08 21:25:25'),
(2, 1, NULL, 'H05RnUAN5B5YbhMg69d9nGjRPY1Ye3gFzMZEdfG7', 'in_progress', '2025-09-10 02:01:40', NULL, '2025-09-10 02:01:41', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:01:40', '2025-09-10 02:01:41'),
(3, 1, NULL, 'CMVvpdbCn0aYLYoXUJPDEKbJmYxvYDBwfovEXePb', 'in_progress', '2025-09-10 02:01:48', NULL, '2025-09-10 10:01:48', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:01:48', '2025-09-10 02:01:48'),
(4, 1, NULL, '43djMYSQLGnEvPqMI1UUcEBahNmraKGP337G4klU', 'in_progress', '2025-09-10 02:01:52', NULL, '2025-09-10 02:01:53', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:01:52', '2025-09-10 02:01:53'),
(5, 1, NULL, 'VcMJwLGPOaweEgAh26NLc4DAx9zH3qmTrQni7JVV', 'in_progress', '2025-09-10 02:14:32', NULL, '2025-09-10 10:14:32', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:14:32', '2025-09-10 02:14:32'),
(6, 1, NULL, 'npp0QGMh1bUEy7eNesnrUMTJOcMAJIFZHAmyfrrW', 'in_progress', '2025-09-10 02:17:05', NULL, '2025-09-10 10:17:05', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:17:05', '2025-09-10 02:17:05'),
(7, 1, NULL, 'vkqUe6784WOvW1nFuczYzP9Wc88g0qIqYnnCZOoJ', 'in_progress', '2025-09-10 02:17:06', NULL, '2025-09-10 10:17:06', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:17:06', '2025-09-10 02:17:06'),
(8, 1, NULL, 'YXxBNmWoyH4489dzrhUh5Ga0ZRiepJaZEV8W88MO', 'in_progress', '2025-09-10 02:17:24', NULL, '2025-09-10 10:17:24', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:17:24', '2025-09-10 02:17:24'),
(9, 1, NULL, 'rgSF9JtDY9ibLofMx46531JJf6EBqQ6fTTMunfrF', 'in_progress', '2025-09-10 02:17:25', NULL, '2025-09-10 10:17:25', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:17:25', '2025-09-10 02:17:25'),
(10, 1, NULL, 'eXrhtlzI2ucgxifHhrnRJPWUXop6PCFz1suoiDPQ', 'in_progress', '2025-09-10 02:19:14', NULL, '2025-09-10 10:19:14', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:19:14', '2025-09-10 02:19:14'),
(11, 1, NULL, 'MyIk7iLHgbNL2VGjRMazZDyl90hGaNx7y5a86CQo', 'in_progress', '2025-09-10 02:19:37', NULL, '2025-09-10 10:19:37', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:19:37', '2025-09-10 02:19:37'),
(12, 1, NULL, 'XM9O53KE91Z9gLxNNmnGm1v5Acjax1cjXi1MpfPC', 'in_progress', '2025-09-10 02:22:09', NULL, '2025-09-10 10:22:09', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:22:09', '2025-09-10 02:22:09'),
(13, 1, NULL, 'c4RSm5adVBKi4p7Hn1xFjH4KO8ydpswKrR81EAPB', 'in_progress', '2025-09-10 02:23:03', NULL, '2025-09-10 10:23:03', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:23:03', '2025-09-10 02:23:03'),
(14, 1, NULL, 'X4BRLZwsxXDkIi0awwfs88ze1cbLgxZoO2mLO6IV', 'in_progress', '2025-09-10 02:23:24', NULL, '2025-09-10 10:23:24', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:23:24', '2025-09-10 02:23:24'),
(15, 1, NULL, 'BhEXqPwbZGx5nRgf7bYRQjpLxRof046nxhQ09naC', 'in_progress', '2025-09-10 02:23:34', NULL, '2025-09-10 10:23:34', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:23:34', '2025-09-10 02:23:34'),
(16, 1, NULL, 'OStSIxdcpOc1keQKj0DO6avVphzbikhajV5QoJU4', 'in_progress', '2025-09-10 02:26:36', NULL, '2025-09-10 10:26:36', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:26:36', '2025-09-10 02:26:36'),
(17, 1, NULL, 'u6Qcf6LjGbPMhAs8Nmly7YOmC4EpkpD0mBciPJQL', 'in_progress', '2025-09-10 02:27:33', NULL, '2025-09-10 02:28:53', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 12, 54.55, NULL, 1, '2025-09-10 02:27:33', '2025-09-10 02:28:53'),
(18, 1, NULL, 'K5n4DRTfZCopsngGwHCOVepDru4s23VwLzPYirtt', 'in_progress', '2025-09-10 02:31:13', NULL, '2025-09-10 10:31:13', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:31:13', '2025-09-10 02:31:13'),
(19, 1, NULL, '2Ygz00v0k9DA6AX3A1brWscQZnW5ucsFXmauo4Uo', 'in_progress', '2025-09-10 02:31:15', NULL, '2025-09-10 10:31:15', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:31:15', '2025-09-10 02:31:15'),
(20, 1, NULL, 'WFVdnjS7NszSrB0anVCBzPe2WebGUIW4DGGnnBUX', 'in_progress', '2025-09-10 02:33:52', NULL, '2025-09-10 10:33:52', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:33:52', '2025-09-10 02:33:52'),
(21, 1, NULL, '0uycMQN5PoEw4vpmSK7TYvR4Ev7bFxaDjep3Igcz', 'in_progress', '2025-09-10 02:35:02', NULL, '2025-09-10 10:35:02', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:35:02', '2025-09-10 02:35:02'),
(22, 1, NULL, '5m4a6NoCGmE4nCFvCjxqGPteEi0OyCkm3AmzqVOv', 'in_progress', '2025-09-10 02:36:16', NULL, '2025-09-10 10:36:16', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:36:16', '2025-09-10 02:36:16'),
(23, 1, NULL, 'hWyopLvayeshHVVJFXxv5cVqrgQA1XWkf0wadmbj', 'in_progress', '2025-09-10 02:36:43', NULL, '2025-09-10 10:36:43', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:36:43', '2025-09-10 02:36:43'),
(24, 1, NULL, 'nCYFpN3iXb9olECm2FMUmyQ1OCpGi9RTmD8oWWAF', 'in_progress', '2025-09-10 02:38:58', NULL, '2025-09-10 10:38:58', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:38:58', '2025-09-10 02:38:58'),
(25, 1, NULL, 'Y8741KpV2vqSd4GrMrczB7E3xksbm513oFypStjt', 'in_progress', '2025-09-10 02:44:13', NULL, '2025-09-10 10:44:13', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 02:44:13', '2025-09-10 02:44:13'),
(26, 1, NULL, 'tNJTIEYAnFQneZ8EbjWN5EAoa3OjJi4xfHKolY5Q', 'in_progress', '2025-09-10 02:44:13', NULL, '2025-09-10 02:45:07', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 22, 100.00, NULL, 1, '2025-09-10 02:44:13', '2025-09-10 02:45:07'),
(27, 1, NULL, 'Y2pwexr0qQZ7VVRS0pBoWEoUnILOHOuzkkyb7FlS', 'in_progress', '2025-09-10 18:58:00', NULL, '2025-09-11 02:58:00', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 18:58:00', '2025-09-10 18:58:00'),
(28, 1, NULL, '88rGa3lmUgZIbBMJX41D9eXPsquv2bnSHaCge4g7', 'in_progress', '2025-09-10 19:16:43', NULL, '2025-09-10 19:17:38', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 22, 100.00, NULL, 1, '2025-09-10 19:16:43', '2025-09-10 19:17:38'),
(29, 1, NULL, 'kAmgqlvTeFv2iFjw7m2Ol0KmYTDndQ0Jjzl8TXhB', 'in_progress', '2025-09-10 19:25:35', NULL, '2025-09-11 03:25:35', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.103.2 Chrome/138.0.7204.100 Electron/37.2.3 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 19:25:35', '2025-09-10 19:25:35'),
(30, 1, NULL, 'ldetSustEmVQiBGHf1qCXoWlNCcQzumPATkJAYRm', 'in_progress', '2025-09-10 19:25:42', NULL, '2025-09-11 03:25:42', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 19:25:42', '2025-09-10 19:25:42'),
(31, 1, 4, 'hcEmjhWJxqWFkxDPLzBbbslONh48Pfd4bGKCPDiU', 'completed', '2025-09-10 19:25:43', '2025-09-10 19:26:45', '2025-09-11 03:26:45', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 22, 100.00, NULL, 1, '2025-09-10 19:25:43', '2025-09-10 19:26:45'),
(32, 1, NULL, '0P9MycRKqlReoQuHtRSzmaagWnKiGjKH5xSVRlG7', 'in_progress', '2025-09-10 19:30:27', NULL, '2025-09-11 03:30:27', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 19:30:27', '2025-09-10 19:30:27'),
(33, 1, NULL, 'ZklY0O6rhx52aNle1bvvUmB3fycQM5tgCbOLmPbs', 'in_progress', '2025-09-10 19:32:23', NULL, '2025-09-11 03:32:23', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 19:32:23', '2025-09-10 19:32:23'),
(34, 1, NULL, 'COtpCtBgxONB1sRdUGSoRbhbjlih8JeQhQorNQVY', 'in_progress', '2025-09-10 19:38:24', NULL, '2025-09-11 03:38:24', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 19:38:24', '2025-09-10 19:38:24'),
(35, 1, NULL, 'MQCKOtuFEJdRP7gzcumDBxbduGhmIb9BB0S4UCAI', 'in_progress', '2025-09-10 19:56:41', NULL, '2025-09-11 03:56:41', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 19:56:41', '2025-09-10 19:56:41'),
(36, 1, NULL, 'UPSAac2VG9dNRLcFojMkrOOvabG1Rju6eMMHktw7', 'in_progress', '2025-09-10 19:58:12', NULL, '2025-09-11 03:58:12', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 19:58:12', '2025-09-10 19:58:12'),
(37, 1, NULL, 'CkDwHGeBuevKRkfoHpWUU3u9ZFaR3b2tzj7VOCyn', 'in_progress', '2025-09-10 20:00:00', NULL, '2025-09-11 04:00:00', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:00:00', '2025-09-10 20:00:00'),
(38, 1, NULL, 'tLCOVZ6Ey7aqftlDGBUb4KhRCYlLSJV2Woywse7O', 'in_progress', '2025-09-10 20:11:10', NULL, '2025-09-11 04:11:10', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:11:10', '2025-09-10 20:11:10'),
(39, 1, NULL, 'NywqFfQXuD77fAckevIH5Jzx3RUZQ91HTwRgGK8L', 'in_progress', '2025-09-10 20:11:15', NULL, '2025-09-11 04:11:15', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:11:15', '2025-09-10 20:11:15'),
(40, 1, NULL, 'm1EDvF3ZSYiqu0QRrucPbDSgtJ5QvbUVUpt0zReE', 'in_progress', '2025-09-10 20:11:22', NULL, '2025-09-11 04:11:22', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:11:22', '2025-09-10 20:11:22'),
(41, 1, NULL, 'IaP1Q8ndCfUB2EWNyImXXY3sqZG7zVwtFX2FDOlt', 'in_progress', '2025-09-10 20:14:14', NULL, '2025-09-11 04:14:14', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:14:14', '2025-09-10 20:14:14'),
(42, 1, NULL, 'DnPuqIOLrDA6AocV9GIi0itv1dElm6iGfbgdyvqf', 'in_progress', '2025-09-10 20:15:14', NULL, '2025-09-11 04:15:14', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:15:14', '2025-09-10 20:15:14'),
(43, 1, NULL, '01Y62Ou5lE0o79pXOZj49aRF3BfQuABxZ4A5mOUl', 'in_progress', '2025-09-10 20:15:59', NULL, '2025-09-11 04:15:59', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:15:59', '2025-09-10 20:15:59'),
(44, 1, NULL, 'ZpuV1zoGQqkhQ1q3LrSipVd0I8ypRPmqGpQKbRtd', 'in_progress', '2025-09-10 20:16:46', NULL, '2025-09-11 04:16:46', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:16:46', '2025-09-10 20:16:46'),
(45, 1, NULL, 'i2pGQMjV3bOUU4XtRYTwmKSlv2vzvEwM7Lq3FH0N', 'in_progress', '2025-09-10 20:18:26', NULL, '2025-09-11 04:18:26', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:18:26', '2025-09-10 20:18:26'),
(46, 1, NULL, 'kQIH2ukoAMx2mCGrY1aNsrlJi72ywwcSnyjEFIZn', 'in_progress', '2025-09-10 20:20:35', NULL, '2025-09-11 04:20:35', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:20:35', '2025-09-10 20:20:35'),
(47, 1, NULL, '736jfjfl0zPnKHRd0ViDKyN2Ljn43Lp31mzSAUgB', 'in_progress', '2025-09-10 20:20:43', NULL, '2025-09-11 04:20:43', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:20:43', '2025-09-10 20:20:43'),
(48, 1, NULL, 'sT6KjKuJc6WAjzGlLhiG897W6WgwGMh7QgnI2p36', 'in_progress', '2025-09-10 20:21:02', NULL, '2025-09-11 04:21:02', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:21:02', '2025-09-10 20:21:02'),
(49, 1, NULL, 'fK6yVWmodGbrm5t7fhUrx0npd5ShtBok8CS3VbsA', 'in_progress', '2025-09-10 20:21:26', NULL, '2025-09-11 04:21:26', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:21:26', '2025-09-10 20:21:26'),
(50, 1, NULL, 'AE1SPnW6iAWeGhGRBNzloI9gHM7qVHy85aBJuqzL', 'in_progress', '2025-09-10 20:22:18', NULL, '2025-09-11 04:22:18', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:22:18', '2025-09-10 20:22:18'),
(51, 1, NULL, '4rZEPVHDNDYYtQvtwChewwtRLaHzt59HnCurl5UY', 'in_progress', '2025-09-10 20:22:39', NULL, '2025-09-11 04:22:39', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:22:39', '2025-09-10 20:22:39'),
(52, 1, NULL, 'EyZWOs7GRAKXnyweg1BJyMVsfkADzQsO5Q5tdFnx', 'in_progress', '2025-09-10 20:22:58', NULL, '2025-09-11 04:22:58', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:22:58', '2025-09-10 20:22:58'),
(53, 1, NULL, 'BT0Bz8QrakGcwgsHYzaqT6E2W76EVDoAksx8ySV2', 'in_progress', '2025-09-10 20:23:22', NULL, '2025-09-11 04:23:22', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:23:22', '2025-09-10 20:23:22'),
(54, 1, NULL, '5kPJVhdDiZJEyAabMeAFhDmbtkUrbPcwy870KesH', 'in_progress', '2025-09-10 20:23:39', NULL, '2025-09-11 04:23:39', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:23:39', '2025-09-10 20:23:39'),
(55, 1, NULL, '14oaalaampsWI2HgjAh11oK8KvNhF2QLyx7HmkcU', 'in_progress', '2025-09-10 20:24:59', NULL, '2025-09-11 04:24:59', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:24:59', '2025-09-10 20:24:59'),
(56, 1, NULL, 'a5SevCsudlnGeWuvR57PlAwtLwyIu8JsZ8gYMlNB', 'in_progress', '2025-09-10 20:25:49', NULL, '2025-09-11 04:25:49', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:25:49', '2025-09-10 20:25:49'),
(57, 1, NULL, 'NhTcvTg3AYABQjp6IszK2fMCCthN36QvEDLFXI3g', 'in_progress', '2025-09-10 20:25:51', NULL, '2025-09-11 04:25:51', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:25:51', '2025-09-10 20:25:51'),
(58, 1, NULL, 'k7mPBG8TeuYIeQEXzTZqf4tiwr9WacwkehFiWOk1', 'in_progress', '2025-09-10 20:26:43', NULL, '2025-09-11 04:26:43', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:26:43', '2025-09-10 20:26:43'),
(59, 1, NULL, 'fCoeBDS41n3SY69hyFZtcgsFKXTK6JxMtMX8FmhC', 'in_progress', '2025-09-10 20:27:05', NULL, '2025-09-11 04:27:05', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:27:05', '2025-09-10 20:27:05'),
(60, 1, NULL, '4U7i6herkSVlQSCnDunco37SgYHMg4CUKd478NSk', 'in_progress', '2025-09-10 20:27:15', NULL, '2025-09-11 04:27:15', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:27:15', '2025-09-10 20:27:15'),
(61, 1, NULL, '5vwMEaArw9L0FE8veX64BJbgqCF42fGiHX8MV4SA', 'in_progress', '2025-09-10 20:27:41', NULL, '2025-09-11 04:27:41', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:27:41', '2025-09-10 20:27:41'),
(62, 1, NULL, 'nC4sYOhQGgmkH2tnlvD8sXoQ3XJ3Jjojg2NUCmSZ', 'in_progress', '2025-09-10 20:28:18', NULL, '2025-09-11 04:28:18', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:28:18', '2025-09-10 20:28:18'),
(63, 1, NULL, 'NOIWJ4BoRm95jei5CItbf2InHd2mjsSYD6cVgoiR', 'in_progress', '2025-09-10 20:28:43', NULL, '2025-09-11 04:28:43', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:28:43', '2025-09-10 20:28:43'),
(64, 1, NULL, 'pvnkP5mHRwrimOfFa5oTNud8hCHGnN7imc1Zxckr', 'in_progress', '2025-09-10 20:29:03', NULL, '2025-09-11 04:29:03', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:29:03', '2025-09-10 20:29:03'),
(65, 1, NULL, 'kF3dktpepOXLP1adfnxXaPIDBcIGXSf8l7CW9Lue', 'in_progress', '2025-09-10 20:29:25', NULL, '2025-09-11 04:29:25', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:29:25', '2025-09-10 20:29:25'),
(66, 1, NULL, 'aKAfxL8PEY3uWm9c9Q9qgF4cVeCYKqJ5orU5YrfU', 'in_progress', '2025-09-10 20:33:29', NULL, '2025-09-11 04:33:29', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:33:29', '2025-09-10 20:33:29'),
(67, 1, NULL, '0u9zjrmxPYZ6KXkFgzo8gXjiKq3Oqx3Hhmb9OAF4', 'in_progress', '2025-09-10 20:33:31', NULL, '2025-09-11 04:33:31', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:33:31', '2025-09-10 20:33:31'),
(68, 1, NULL, 'bSVnToCfOOv7YePBYV4yTlTJO0FZm4TyFrkUvwbn', 'in_progress', '2025-09-10 20:39:32', NULL, '2025-09-11 04:39:32', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:39:32', '2025-09-10 20:39:32'),
(69, 1, 5, 'RgA36rynNfO1fRQjhYdqqMb4nIjWaQMsH6FaJ3SX', 'completed', '2025-09-10 20:44:06', '2025-09-10 20:45:23', '2025-09-10 20:45:23', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 22, 100.00, NULL, 1, '2025-09-10 20:44:06', '2025-09-10 20:45:23'),
(70, 1, NULL, 'F2sjnT0vojShcWCzdxdcatqjo5IwXbiZxa1ls5lV', 'in_progress', '2025-09-10 20:46:27', NULL, '2025-09-11 04:46:27', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:46:27', '2025-09-10 20:46:27'),
(71, 1, NULL, 'LHikUeOXplTk32UvnZaBNeC0eJBj0AfpFFrT6G1a', 'in_progress', '2025-09-10 20:49:43', NULL, '2025-09-11 04:49:43', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 20:49:43', '2025-09-10 20:49:43'),
(72, 1, NULL, '7oZjF6byxtRd9baccuqj29IJxmS7zJ7Yt4SislzW', 'in_progress', '2025-09-10 21:05:01', NULL, '2025-09-11 05:05:01', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:05:01', '2025-09-10 21:05:01'),
(73, 1, NULL, 'wrDUIsQoT6TPUlkxx1tVdlMkaLqnwotkNOwU90B5', 'in_progress', '2025-09-10 21:05:18', NULL, '2025-09-11 05:05:18', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:05:18', '2025-09-10 21:05:18'),
(74, 1, NULL, '33ni3g3IUebnkE9bYFtbOLLL8BVHjn4VR8fRLil5', 'in_progress', '2025-09-10 21:05:35', NULL, '2025-09-11 05:05:35', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:05:35', '2025-09-10 21:05:35'),
(75, 1, NULL, '30F52NkGQKaPITNkeoAnmGfKyf94Y6cIw6eMaMyt', 'in_progress', '2025-09-10 21:05:43', NULL, '2025-09-11 05:05:43', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:05:43', '2025-09-10 21:05:43'),
(76, 1, NULL, 'CisO6Mi6KAJLgs5wGZuzoZFnMlul1zPcuaJG5oS3', 'in_progress', '2025-09-10 21:06:01', NULL, '2025-09-11 05:06:01', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:06:01', '2025-09-10 21:06:01'),
(77, 1, NULL, 'Tbox6GOPmm9I8kyFTXPC957Pe9C516L8mhy74XNP', 'in_progress', '2025-09-10 21:15:43', NULL, '2025-09-11 05:15:43', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:15:43', '2025-09-10 21:15:43'),
(78, 1, NULL, 'v66p2BQmm5vHj3lLQDdLyxeKDlYLtiKuA6kUGB1g', 'in_progress', '2025-09-10 21:52:26', NULL, '2025-09-11 05:52:26', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:52:26', '2025-09-10 21:52:26'),
(79, 1, NULL, 'gBhPToWoRoYFWZxxxOB35w8ZgqRWAMVHMH8MEkuq', 'in_progress', '2025-09-10 21:52:33', NULL, '2025-09-11 05:52:33', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:52:33', '2025-09-10 21:52:33'),
(80, 1, NULL, '78Ug6gfgtfqwVJAjmg0Nh7rgExTq1fpE1irBmH2R', 'in_progress', '2025-09-10 21:52:53', NULL, '2025-09-11 05:52:53', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:52:53', '2025-09-10 21:52:53'),
(81, 1, NULL, 'df9SixAG9x7PuwYTLoNEyKesvNd3a2tYW2T0xisu', 'in_progress', '2025-09-10 21:52:59', NULL, '2025-09-10 21:53:00', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:52:59', '2025-09-10 21:53:00'),
(82, 1, NULL, '4DB9yvAvc4wmQ9VspQe5b5IA5AzjJIMq7yWVW9Ei', 'in_progress', '2025-09-10 21:53:42', NULL, '2025-09-11 05:53:42', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:53:42', '2025-09-10 21:53:42'),
(83, 1, NULL, 's5kIX9NAfLjKmTdhkkC69Stl4B4wG2vbVsJjyBK5', 'in_progress', '2025-09-10 21:53:46', NULL, '2025-09-11 05:53:46', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:53:46', '2025-09-10 21:53:46'),
(84, 1, NULL, '3jlYAR5KfvUL0mycd35Q1tKnh40XmMiVZ23jeZsf', 'in_progress', '2025-09-10 21:53:51', NULL, '2025-09-11 05:53:51', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:53:51', '2025-09-10 21:53:51'),
(85, 1, NULL, 'STdE8zxqG2YVA6YvVysbG1U1FFLw1QAFYwpkSCq3', 'in_progress', '2025-09-10 21:54:38', NULL, '2025-09-11 05:54:38', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:54:38', '2025-09-10 21:54:38'),
(86, 1, NULL, '5qZxkpeXsVYbCX5tCG4lq4zukFSbKvKDp8Rm2uo9', 'in_progress', '2025-09-10 21:56:51', NULL, '2025-09-11 05:56:51', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:56:51', '2025-09-10 21:56:51'),
(87, 1, NULL, 'oYBrgxBhjqP4qbfOBmm3ka58LAIS4zNlkfls37CS', 'in_progress', '2025-09-10 21:56:54', NULL, '2025-09-11 05:56:54', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:56:54', '2025-09-10 21:56:54'),
(88, 1, NULL, 'yB8FjDvt00mACS23qjw7cKgPpf16fX04uFKPv5ki', 'in_progress', '2025-09-10 21:57:12', NULL, '2025-09-11 05:57:12', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:57:12', '2025-09-10 21:57:12'),
(89, 1, NULL, 'KBQoJURaArpfmIqyg5BTgbxxKFBtab0giMtBPchx', 'in_progress', '2025-09-10 21:57:59', NULL, '2025-09-11 05:57:59', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 21:57:59', '2025-09-10 21:57:59'),
(90, 1, NULL, 'wEgcJokdA8mnX42kOu4VJZCy58izGLJHouQ6VRhm', 'in_progress', '2025-09-10 22:03:41', NULL, '2025-09-11 06:03:41', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 22:03:41', '2025-09-10 22:03:41'),
(91, 1, NULL, 'k3MmRmtBCXIknfshXXLp1FjoRX5CSWMi5SIs7cgN', 'in_progress', '2025-09-10 23:23:51', NULL, '2025-09-11 07:23:51', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 23:23:51', '2025-09-10 23:23:51'),
(92, 1, NULL, 'fVvRuCeXImacBwHYtN9RklTB9sWukL1EsL0WnKNM', 'in_progress', '2025-09-10 23:26:53', NULL, '2025-09-11 07:26:53', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-10 23:26:53', '2025-09-10 23:26:53'),
(93, 1, NULL, 'vbc7OyJaLJpSyxW6c4ZWmc97ZTRs3xtAABnPFsEu', 'in_progress', '2025-09-11 00:28:07', NULL, '2025-09-11 08:28:07', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-11 00:28:07', '2025-09-11 00:28:07'),
(94, 1, NULL, 'kdv2v7c4cTGZnxZZabeguHxgcgvnDw60y9BeWs1k', 'in_progress', '2025-09-11 01:18:26', NULL, '2025-09-11 09:18:26', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-11 01:18:26', '2025-09-11 01:18:26'),
(95, 1, NULL, 'CLhByGKw0A1OAAkPsGT3LoFGkeMqk9KkeT0ZtwHb', 'in_progress', '2025-09-11 01:25:02', NULL, '2025-09-11 09:25:02', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-11 01:25:02', '2025-09-11 01:25:02'),
(96, 1, NULL, '00EWxaq1z75xbyJI7WgSp2erCwlgvoBc90TNSNgl', 'in_progress', '2025-09-13 03:05:34', NULL, '2025-09-13 11:05:34', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-13 03:05:34', '2025-09-13 03:05:34'),
(97, 1, NULL, 'X89nxZkgvHRgqbP30cIxZifRQQeaFWQ9TRzuVvuQ', 'in_progress', '2025-09-13 22:53:22', NULL, '2025-09-14 06:53:22', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-13 22:53:22', '2025-09-13 22:53:22'),
(98, 1, NULL, 'ZHSOnCr5QqwlNgtnANfhqRdJoN9dva4aNWHimsZK', 'in_progress', '2025-09-13 23:50:18', NULL, '2025-09-14 07:50:18', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-13 23:50:18', '2025-09-13 23:50:18'),
(99, 1, NULL, 'NggkzDD9u10xo7XwLE5qCdg0c6WHystegjEp1uiN', 'in_progress', '2025-09-13 23:55:09', NULL, '2025-09-14 07:55:09', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-13 23:55:09', '2025-09-13 23:55:09'),
(100, 1, NULL, 'Kr7E5oidOaEXOu6oc7u5tlorxlYrR6oyEwdSubpJ', 'in_progress', '2025-09-13 23:55:23', NULL, '2025-09-14 07:55:23', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-13 23:55:23', '2025-09-13 23:55:23'),
(101, 1, NULL, 'e4wBgJUXURLyOMHRk8U0gmZfcroWNpAi1zR7ir2I', 'in_progress', '2025-09-13 23:55:34', NULL, '2025-09-14 07:55:34', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', NULL, 22, 0, 0.00, NULL, 1, '2025-09-13 23:55:34', '2025-09-13 23:55:34'),
(102, 1, NULL, 'BaOcrBADIExASNvllxDbF2sXqiQClHQWYmR3p08D', 'in_progress', '2025-09-14 00:02:07', NULL, '2025-09-14 08:02:07', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-14 00:02:07', '2025-09-14 00:02:07'),
(103, 1, NULL, 'SURXADH6pYVvlJ6db5J6IpX3sj2NDRK1biAPOewZ', 'in_progress', '2025-09-14 00:02:11', NULL, '2025-09-14 08:02:11', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-14 00:02:11', '2025-09-14 00:02:11'),
(104, 1, NULL, 'BHV5cu1u7TopvTgHVpIRo1jPA5rydg5USI96sg9h', 'in_progress', '2025-09-14 16:42:51', NULL, '2025-09-15 00:42:51', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-14 16:42:51', '2025-09-14 16:42:51'),
(105, 1, NULL, 'ILpzuWnRrEQhjvomunI4SYzdX2aMpetfPZkEgovL', 'in_progress', '2025-09-14 18:22:45', NULL, '2025-09-15 02:22:45', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-14 18:22:45', '2025-09-14 18:22:45'),
(106, 1, NULL, 'lTkl24SlNxabitbOaYZKshNyBSDmiRRlOMGz7HOn', 'in_progress', '2025-09-14 18:27:21', NULL, '2025-09-15 02:27:21', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-14 18:27:21', '2025-09-14 18:27:21'),
(107, 1, NULL, 'zv3XdB5gnNjDSF3el7ylA1bfaTbGJ3AhgQMbzus7', 'in_progress', '2025-09-14 18:27:41', NULL, '2025-09-15 02:27:41', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-14 18:27:41', '2025-09-14 18:27:41'),
(108, 1, NULL, 'fLEVpFvOhMPXZjvVTgpXVkbeQfY7THlV2hHYxixu', 'in_progress', '2025-09-14 18:33:48', NULL, '2025-09-15 02:33:48', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-14 18:33:48', '2025-09-14 18:33:48'),
(109, 1, NULL, 'tuGAUmoVK2UMzV9pubN04D17Z86o14XS7vTZvP2o', 'in_progress', '2025-09-14 18:35:50', NULL, '2025-09-15 02:35:50', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-14 18:35:50', '2025-09-14 18:35:50'),
(110, 1, NULL, 'tpzjnWcZKp4kl9YdhjHZWc3jfwyXTSnGtfXX6IJu', 'in_progress', '2025-09-14 18:36:30', NULL, '2025-09-15 02:36:30', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-14 18:36:30', '2025-09-14 18:36:30');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','alumni') NOT NULL DEFAULT 'alumni',
  `status` enum('active','inactive','pending') NOT NULL DEFAULT 'pending',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `status`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, NULL, 'admin@alumnitracer.edu', '2025-09-08 00:41:59', '$2y$12$eeWxtaWUN93GVJ3QGIiysOWg.QTo3AumyCv5LC4ArTR269AZdaBAW', 'admin', 'active', NULL, '2025-09-07 22:32:17', '2025-09-08 00:41:59'),
(2, NULL, 'jane@example.com', NULL, '$2y$12$..arKLae6B8Vo1Epx3ds3.5y8qf9BVLbk/XbEqgYJRaEUqidxy9iK', 'alumni', 'active', NULL, '2025-09-09 23:06:33', '2025-09-09 23:06:33'),
(3, NULL, 'debug@example.com', NULL, '$2y$12$3SNQ.UHNWVosQhoa0fY2DuiHOinnX9rkJcC5FBvzgom21QzfvKTX6', 'alumni', 'active', NULL, '2025-09-09 23:37:47', '2025-09-09 23:37:47'),
(4, 'Adrian Nacu', 'nacu.a.bscs@gmail.com', NULL, '$2y$12$eguW.VDzTBaVvkv1LRnfUuI.Xc.YI8AJ76GUGsjhVtI8xUVXihVGO', 'alumni', 'active', 'xpAudOYSnKCOQf7172qJYxiWZM7S9vpoffyhzT6vizE7W2TQ5hrIMFGZ2YLs', '2025-09-10 19:26:45', '2025-09-10 19:26:45'),
(5, 'Test Test', 'test@gmail.com', NULL, '$2y$12$/Ot1nO/1ASq7tWG6vgPYN.rqQkxRuOHJEk56eRcB/iipBLuAr1uWu', 'alumni', 'active', NULL, '2025-09-10 20:45:22', '2025-09-10 20:45:22'),
(6, 'Admin User', 'admin@alumni.com', '2025-09-13 22:47:04', '$2y$12$.W/yBwj85ILS8tNCNDBRiOaJy/Ll7H5u8am.JCDvr57lMHwUGpvHe', 'admin', 'active', NULL, '2025-09-13 22:47:04', '2025-09-13 22:47:04'),
(7, 'Admin User', 'admin@test.com', NULL, '$2y$12$Scz2nwshg6q3tAeSjF8UDumJTLwVIkfXUsJxrbs.V.dG6iUaBZ2EW', 'admin', 'active', 'eumGyooSCmdJhqlxHkJq6eAqbgZveeTgWFHosQtNtxzv5xa0BUnZmO3nw4KW', '2025-09-13 23:24:52', '2025-09-13 23:24:52');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_logs_user_id_action_index` (`user_id`,`action`),
  ADD KEY `activity_logs_entity_type_entity_id_index` (`entity_type`,`entity_id`),
  ADD KEY `activity_logs_created_at_index` (`created_at`);

--
-- Indexes for table `admin_settings`
--
ALTER TABLE `admin_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `admin_settings_key_unique` (`key`),
  ADD KEY `admin_settings_category_key_index` (`category`,`key`);

--
-- Indexes for table `alumni_profiles`
--
ALTER TABLE `alumni_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `alumni_profiles_student_id_unique` (`student_id`),
  ADD KEY `alumni_profiles_user_id_foreign` (`user_id`),
  ADD KEY `alumni_profiles_graduation_year_employment_status_index` (`graduation_year`,`employment_status`),
  ADD KEY `alumni_profiles_batch_id_employment_status_index` (`batch_id`,`employment_status`);

--
-- Indexes for table `batches`
--
ALTER TABLE `batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `surveys`
--
ALTER TABLE `surveys`
  ADD PRIMARY KEY (`id`),
  ADD KEY `surveys_created_by_foreign` (`created_by`),
  ADD KEY `surveys_status_type_index` (`status`,`type`),
  ADD KEY `surveys_start_date_end_date_index` (`start_date`,`end_date`);

--
-- Indexes for table `survey_answers`
--
ALTER TABLE `survey_answers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `survey_answers_survey_response_id_survey_question_id_unique` (`survey_response_id`,`survey_question_id`),
  ADD KEY `survey_answers_survey_response_id_survey_question_id_index` (`survey_response_id`,`survey_question_id`),
  ADD KEY `survey_answers_survey_question_id_index` (`survey_question_id`),
  ADD KEY `survey_answers_answered_at_index` (`answered_at`);

--
-- Indexes for table `survey_invitations`
--
ALTER TABLE `survey_invitations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `survey_invitations_invitation_token_unique` (`invitation_token`),
  ADD KEY `survey_invitations_batch_id_foreign` (`batch_id`),
  ADD KEY `survey_invitations_survey_id_status_index` (`survey_id`,`status`),
  ADD KEY `survey_invitations_email_survey_id_index` (`email`,`survey_id`),
  ADD KEY `survey_invitations_invitation_token_index` (`invitation_token`);

--
-- Indexes for table `survey_questions`
--
ALTER TABLE `survey_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `survey_questions_survey_id_order_index` (`survey_id`,`order`),
  ADD KEY `survey_questions_survey_id_is_active_index` (`survey_id`,`is_active`);

--
-- Indexes for table `survey_responses`
--
ALTER TABLE `survey_responses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `survey_responses_response_token_unique` (`response_token`),
  ADD KEY `survey_responses_survey_id_status_index` (`survey_id`,`status`),
  ADD KEY `survey_responses_user_id_survey_id_index` (`user_id`,`survey_id`),
  ADD KEY `survey_responses_respondent_email_index` (`respondent_email`),
  ADD KEY `survey_responses_response_token_index` (`response_token`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `admin_settings`
--
ALTER TABLE `admin_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `alumni_profiles`
--
ALTER TABLE `alumni_profiles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `batches`
--
ALTER TABLE `batches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `surveys`
--
ALTER TABLE `surveys`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `survey_answers`
--
ALTER TABLE `survey_answers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT for table `survey_invitations`
--
ALTER TABLE `survey_invitations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey_questions`
--
ALTER TABLE `survey_questions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `survey_responses`
--
ALTER TABLE `survey_responses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=111;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `alumni_profiles`
--
ALTER TABLE `alumni_profiles`
  ADD CONSTRAINT `alumni_profiles_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `alumni_profiles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `surveys`
--
ALTER TABLE `surveys`
  ADD CONSTRAINT `surveys_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_answers`
--
ALTER TABLE `survey_answers`
  ADD CONSTRAINT `survey_answers_survey_question_id_foreign` FOREIGN KEY (`survey_question_id`) REFERENCES `survey_questions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `survey_answers_survey_response_id_foreign` FOREIGN KEY (`survey_response_id`) REFERENCES `survey_responses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_invitations`
--
ALTER TABLE `survey_invitations`
  ADD CONSTRAINT `survey_invitations_batch_id_foreign` FOREIGN KEY (`batch_id`) REFERENCES `batches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `survey_invitations_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_questions`
--
ALTER TABLE `survey_questions`
  ADD CONSTRAINT `survey_questions_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_responses`
--
ALTER TABLE `survey_responses`
  ADD CONSTRAINT `survey_responses_survey_id_foreign` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `survey_responses_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
