-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 03, 2025 at 07:23 AM
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
(7, 5, 'survey_completed', 'Survey', 1, 'Completed survey', '{\"response_id\":69}', '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1', '2025-09-10 20:45:23', '2025-09-10 20:45:23'),
(8, 8, 'user_registered_via_survey', 'Survey', 1, 'Alumni registered via survey completion', '{\"response_id\":111}', '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-09-14 20:19:29', '2025-09-14 20:19:29'),
(9, 8, 'survey_completed', 'Survey', 1, 'Completed survey', '{\"response_id\":111}', '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-09-14 20:19:29', '2025-09-14 20:19:29'),
(10, 8, 'login', 'User', 8, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-09-14 20:19:47', '2025-09-14 20:19:47'),
(11, 8, 'login', 'User', 8, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-14 20:48:45', '2025-09-14 20:48:45'),
(12, 4, 'login', 'User', 4, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-14 20:48:53', '2025-09-14 20:48:53'),
(13, 8, 'login', 'User', 8, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-14 21:13:06', '2025-09-14 21:13:06'),
(14, 4, 'login', 'User', 4, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-14 21:22:56', '2025-09-14 21:22:56'),
(15, 4, 'login', 'User', 4, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-14 21:27:05', '2025-09-14 21:27:05'),
(16, 10, 'login', 'User', 10, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-14 21:44:14', '2025-09-14 21:44:14'),
(17, 10, 'login', 'User', 10, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-14 22:26:20', '2025-09-14 22:26:20'),
(18, 10, 'login', 'User', 10, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-14 22:26:30', '2025-09-14 22:26:30'),
(19, 10, 'login', 'User', 10, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-14 22:27:55', '2025-09-14 22:27:55'),
(20, 10, 'login', 'User', 10, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-14 22:28:41', '2025-09-14 22:28:41'),
(21, 10, 'login', 'User', 10, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-09-14 22:28:48', '2025-09-14 22:28:48'),
(22, 10, 'login', 'User', 10, 'User logged in', NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', '2025-09-14 22:29:59', '2025-09-14 22:29:59'),
(23, 1, 'view', 'ActivityLog', NULL, 'Accessed activity logs page', NULL, '127.0.0.1', 'Symfony', '2025-09-14 23:40:19', '2025-09-14 23:40:19'),
(24, 1, 'test', 'Test', 1, 'Testing activity logs API', NULL, '127.0.0.1', 'Test Browser', '2025-09-14 23:48:17', '2025-09-14 23:48:17'),
(25, 10, 'logout', 'User', 10, 'User logged out', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-09-14 23:53:48', '2025-09-14 23:53:48'),
(26, 16, 'user_registered_via_survey', 'Survey', 1, 'Alumni registered via survey completion', '{\"response_id\":112}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-10-02 20:38:41', '2025-10-02 20:38:41'),
(27, 16, 'survey_completed', 'Survey', 1, 'Completed survey', '{\"response_id\":112}', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', '2025-10-02 20:38:41', '2025-10-02 20:38:41');

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
(12, 'maintenance_mode', '0', 'boolean', 'Enable maintenance mode', 'maintenance', 0, '2025-09-07 22:32:18', '2025-10-01 15:58:49'),
(13, 'data_retention_years', '10', 'integer', 'Years to retain alumni data', 'system', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(14, 'enable_activity_logging', 'true', 'boolean', 'Enable user activity logging', 'system', 0, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(15, 'app_name', 'Alumni Tracer System', 'text', 'Application name displayed throughout the system', 'general', 1, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(16, 'app_tagline', 'Tracking Alumni Success', 'text', 'Application tagline or motto', 'general', 1, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(17, 'timezone', 'Asia/Manila', 'text', 'Default timezone for the application', 'general', 1, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(18, 'date_format', 'Y-m-d', 'text', 'Date format used in the system', 'general', 1, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(19, 'items_per_page', '25', 'number', 'Default number of items per page in lists', 'general', 1, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(20, 'smtp_host', 'smtp.mailtrap.io', 'text', 'SMTP server hostname', 'email', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(21, 'smtp_port', '587', 'number', 'SMTP server port', 'email', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(22, 'smtp_username', '', 'text', 'SMTP authentication username', 'email', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(23, 'smtp_password', '', 'text', 'SMTP authentication password', 'email', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(24, 'smtp_encryption', 'tls', 'text', 'SMTP encryption method (tls or ssl)', 'email', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(25, 'mail_from_address', 'noreply@alumni-tracer.edu', 'email', 'Default sender email address', 'email', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(26, 'mail_from_name', 'Alumni Tracer System', 'text', 'Default sender name', 'email', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(27, 'enable_email_notifications', '1', 'boolean', 'Enable or disable email notifications', 'notifications', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(28, 'enable_browser_notifications', '1', 'boolean', 'Enable browser push notifications', 'notifications', 1, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(29, 'notify_on_new_alumni', '1', 'boolean', 'Send notification when new alumni registers', 'notifications', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(30, 'notify_on_survey_submission', '1', 'boolean', 'Send notification when survey is submitted', 'notifications', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(31, 'notification_email', 'admin@alumni-tracer.edu', 'email', 'Email address for admin notifications', 'notifications', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(32, 'session_timeout', '120', 'number', 'Session timeout in minutes', 'security', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(33, 'max_login_attempts', '5', 'number', 'Maximum login attempts before lockout', 'security', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(34, 'lockout_duration', '15', 'number', 'Account lockout duration in minutes', 'security', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(35, 'require_email_verification', '1', 'boolean', 'Require email verification for new accounts', 'security', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(36, 'password_min_length', '8', 'number', 'Minimum password length', 'security', 1, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(37, 'enable_two_factor', '0', 'boolean', 'Enable two-factor authentication', 'security', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(38, 'auto_backup', '1', 'boolean', 'Enable automatic database backups', 'maintenance', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(39, 'backup_frequency', 'daily', 'text', 'Backup frequency (daily, weekly, monthly)', 'maintenance', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(40, 'backup_retention_days', '30', 'number', 'Number of days to retain backups', 'maintenance', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(41, 'enable_logging', '1', 'boolean', 'Enable system activity logging', 'maintenance', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49'),
(42, 'log_level', 'info', 'text', 'Logging level (debug, info, warning, error)', 'maintenance', 0, '2025-10-01 15:58:49', '2025-10-01 15:58:49');

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
(1, 4, NULL, 'Adrian', 'Nacu', NULL, '224-12536M', '2005-05-06', 'male', '09763211128', NULL, 'Test', 'Test', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 1.50, '2025', '2025-06-17', 'employed_full_time', 'Senior Software Developer', 'ARUP', NULL, NULL, 100000.00, 'USD', '2025-09-12', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-09-10 19:26:45', '2025-09-10 19:26:45', '2025-10-01 01:39:08'),
(2, 5, 5, 'Test', 'Test', NULL, '224-123456M', '2008-05-13', 'male', '09763211128', NULL, 'Test', 'Test', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 1.00, '2024', '2024-05-29', 'employed_full_time', 'Senior Software Developer', 'ARUP', NULL, NULL, 100000.00, 'USD', '2024-07-17', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-09-10 20:45:22', '2025-09-10 20:45:22', '2025-10-01 01:39:08'),
(3, 8, NULL, 'test', 'test', NULL, '224-123123M', '2004-05-06', 'male', '09763211128', NULL, 'Test', 'Test', NULL, NULL, 'Philippines', 'BSCS', 'N/A', NULL, 1.70, '2025', '2025-05-14', 'employed_full_time', 'Software Engineer', 'ARUP', NULL, NULL, 100000.00, 'USD', '2025-08-18', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-09-14 20:19:29', '2025-09-14 20:19:29', '2025-10-01 01:39:08'),
(4, 4, 1, 'Sample', 'Alumni1', NULL, '224-000001M', '1998-12-09', 'male', '09289707880', NULL, 'Sample Address 1', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 1.79, '2020', '2020-06-15', 'self_employed', 'System Administrator', 'Tech Solutions Inc', NULL, NULL, 127740.00, 'USD', '2020-07-30', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-05-27 16:00:00', '2025-10-01 01:36:51', '2025-10-01 01:39:08'),
(5, 8, 1, 'Sample', 'Alumni2', NULL, '224-000002M', '1998-06-24', 'female', '09158696908', NULL, 'Sample Address 2', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 3.07, '2020', '2020-06-01', 'employed_full_time', 'System Administrator', 'Tech Solutions Inc', NULL, NULL, 30741.00, 'USD', '2020-10-21', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-06-04 16:00:00', '2025-10-01 01:36:51', '2025-10-01 01:39:08'),
(7, 5, 1, 'Sample', 'Alumni123457', NULL, '224-123457M', '1998-10-28', 'female', '09217399683', NULL, 'Sample Address 123457', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 2.52, '2020', '2020-06-12', 'self_employed', 'Senior Engineer', 'Global Systems Corp', NULL, NULL, 140508.00, 'USD', '2020-10-29', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-06-15 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(8, 5, 1, 'Sample', 'Alumni123458', NULL, '224-123458M', '1998-02-27', 'male', '09174645982', NULL, 'Sample Address 123458', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 3.80, '2020', '2020-06-11', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-07-21 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(9, 5, 1, 'Sample', 'Alumni123459', NULL, '224-123459M', '1998-06-22', 'female', '09560806477', NULL, 'Sample Address 123459', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 3.81, '2020', '2020-06-13', 'employed_part_time', 'Project Manager', 'Digital Ventures', NULL, NULL, 81771.00, 'USD', '2020-11-12', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-07-04 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(10, 5, 1, 'Sample', 'Alumni123460', NULL, '224-123460M', '1998-08-23', 'male', '09637492673', NULL, 'Sample Address 123460', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 2.40, '2020', '2020-05-28', 'employed_part_time', 'Business Analyst', 'Industry Leaders Co', NULL, NULL, 107664.00, 'USD', '2020-12-01', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-07-14 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(11, 8, 1, 'Sample', 'Alumni123461', NULL, '224-123461M', '1998-09-28', 'male', '09904267186', NULL, 'Sample Address 123461', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.50, '2020', '2020-05-16', 'employed_part_time', 'Business Analyst', 'Digital Ventures', NULL, NULL, 132486.00, 'USD', '2020-11-25', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-05-19 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(12, 5, 1, 'Sample', 'Alumni123462', NULL, '224-123462M', '1998-06-13', 'female', '09597595952', NULL, 'Sample Address 123462', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 3.22, '2020', '2020-05-09', 'self_employed', 'IT Consultant', 'Digital Ventures', NULL, NULL, 53166.00, 'USD', '2020-09-08', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-06-08 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(13, 8, 1, 'Sample', 'Alumni123463', NULL, '224-123463M', '1998-06-19', 'male', '09326875227', NULL, 'Sample Address 123463', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 1.85, '2020', '2020-06-10', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-08-07 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(14, 4, 1, 'Sample', 'Alumni123464', NULL, '224-123464M', '1998-07-14', 'male', '09257963659', NULL, 'Sample Address 123464', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 2.82, '2020', '2020-05-28', 'employed_part_time', 'System Administrator', 'Industry Leaders Co', NULL, NULL, 54236.00, 'USD', '2020-10-31', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-07-26 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(15, 4, 1, 'Sample', 'Alumni123465', NULL, '224-123465M', '1998-02-20', 'male', '09563793408', NULL, 'Sample Address 123465', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 1.87, '2020', '2020-05-06', 'self_employed', 'System Administrator', 'Innovation Labs', NULL, NULL, 86612.00, 'USD', '2020-11-18', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-06-01 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(16, 11, 1, 'Sample', 'Alumni123466', NULL, '224-123466M', '1998-12-13', 'male', '09482135238', NULL, 'Sample Address 123466', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 2.10, '2020', '2020-06-24', 'self_employed', 'Data Analyst', 'Startup Hub', NULL, NULL, 55031.00, 'USD', '2021-01-03', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-07-03 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(17, 8, 1, 'Sample', 'Alumni123467', NULL, '224-123467M', '1998-08-06', 'male', '09382687092', NULL, 'Sample Address 123467', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 2.31, '2020', '2020-06-09', 'employed_full_time', 'IT Consultant', 'Enterprise Solutions', NULL, NULL, 65133.00, 'USD', '2020-11-19', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-06-15 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(18, 4, 1, 'Sample', 'Alumni123468', NULL, '224-123468M', '1998-10-11', 'female', '09829117843', NULL, 'Sample Address 123468', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 2.88, '2020', '2020-05-19', 'employed_part_time', 'Software Developer', 'Enterprise Solutions', NULL, NULL, 48975.00, 'USD', '2020-09-20', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-07-04 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(19, 11, 1, 'Sample', 'Alumni123469', NULL, '224-123469M', '1998-10-15', 'male', '09636977214', NULL, 'Sample Address 123469', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 3.07, '2020', '2020-05-24', 'employed_full_time', 'IT Consultant', 'Enterprise Solutions', NULL, NULL, 141430.00, 'USD', '2020-10-03', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-06-21 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(20, 4, 1, 'Sample', 'Alumni123470', NULL, '224-123470M', '1998-12-11', 'male', '09509198331', NULL, 'Sample Address 123470', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 1.87, '2020', '2020-05-23', 'employed_full_time', 'Business Analyst', 'Global Systems Corp', NULL, NULL, 102697.00, 'USD', '2020-11-07', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-06-13 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(21, 8, 1, 'Sample', 'Alumni123471', NULL, '224-123471M', '1998-03-06', 'female', '09110551840', NULL, 'Sample Address 123471', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 3.46, '2020', '2020-06-11', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-06-25 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(22, 5, 1, 'Sample', 'Alumni123472', NULL, '224-123472M', '1998-06-15', 'male', '09899092543', NULL, 'Sample Address 123472', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 3.22, '2020', '2020-05-12', 'employed_full_time', 'Business Analyst', 'Digital Ventures', NULL, NULL, 144635.00, 'USD', '2020-10-08', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-06-13 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(23, 11, 1, 'Sample', 'Alumni123473', NULL, '224-123473M', '1998-11-28', 'male', '09951704962', NULL, 'Sample Address 123473', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 3.20, '2020', '2020-05-01', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-06-06 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(24, 11, 1, 'Sample', 'Alumni123474', NULL, '224-123474M', '1998-11-23', 'male', '09417400095', NULL, 'Sample Address 123474', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 3.20, '2020', '2020-05-08', 'self_employed', 'System Administrator', 'Digital Ventures', NULL, NULL, 120974.00, 'USD', '2020-11-03', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-06-07 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(25, 5, 1, 'Sample', 'Alumni123475', NULL, '224-123475M', '1998-03-12', 'male', '09160631293', NULL, 'Sample Address 123475', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 3.00, '2020', '2020-06-16', 'self_employed', 'Project Manager', 'Tech Solutions Inc', NULL, NULL, 123503.00, 'USD', '2020-10-19', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-07-01 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(26, 4, 1, 'Sample', 'Alumni123476', NULL, '224-123476M', '1998-08-12', 'female', '09411333658', NULL, 'Sample Address 123476', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 1.85, '2020', '2020-06-20', 'employed_full_time', 'Data Analyst', 'Industry Leaders Co', NULL, NULL, 96031.00, 'USD', '2020-11-13', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-08-09 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(27, 11, 1, 'Sample', 'Alumni123477', NULL, '224-123477M', '1998-02-25', 'male', '09125655952', NULL, 'Sample Address 123477', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 2.41, '2020', '2020-05-12', 'self_employed', 'Business Analyst', 'Innovation Labs', NULL, NULL, 38780.00, 'USD', '2020-12-06', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-05-17 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(28, 4, 1, 'Sample', 'Alumni123478', NULL, '224-123478M', '1998-07-04', 'female', '09671401265', NULL, 'Sample Address 123478', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 2.15, '2020', '2020-05-06', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-06-25 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(29, 11, 1, 'Sample', 'Alumni123479', NULL, '224-123479M', '1998-12-22', 'female', '09285116494', NULL, 'Sample Address 123479', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.82, '2020', '2020-06-15', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2020-07-02 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(30, 8, 2, 'Sample', 'Alumni123480', NULL, '224-123480M', '1999-12-27', 'female', '09674982180', NULL, 'Sample Address 123480', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 3.39, '2021', '2021-05-07', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-06-08 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(31, 4, 2, 'Sample', 'Alumni123481', NULL, '224-123481M', '1999-06-14', 'female', '09714387874', NULL, 'Sample Address 123481', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 3.43, '2021', '2021-06-13', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-08-08 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(32, 5, 2, 'Sample', 'Alumni123482', NULL, '224-123482M', '1999-02-26', 'female', '09900148988', NULL, 'Sample Address 123482', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 3.23, '2021', '2021-05-13', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-05-17 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(33, 11, 2, 'Sample', 'Alumni123483', NULL, '224-123483M', '1999-12-03', 'male', '09504008818', NULL, 'Sample Address 123483', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 1.89, '2021', '2021-06-24', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-06-28 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(34, 4, 2, 'Sample', 'Alumni123484', NULL, '224-123484M', '1999-04-09', 'female', '09725083979', NULL, 'Sample Address 123484', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 3.79, '2021', '2021-06-03', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-06-06 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(35, 4, 2, 'Sample', 'Alumni123485', NULL, '224-123485M', '1999-07-16', 'female', '09832250754', NULL, 'Sample Address 123485', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 2.25, '2021', '2021-05-24', 'employed_full_time', 'Senior Engineer', 'Tech Solutions Inc', NULL, NULL, 77399.00, 'USD', '2021-11-09', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-06-24 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(36, 4, 2, 'Sample', 'Alumni123486', NULL, '224-123486M', '1999-08-22', 'female', '09500883126', NULL, 'Sample Address 123486', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 2.90, '2021', '2021-06-13', 'employed_full_time', 'Business Analyst', 'Digital Ventures', NULL, NULL, 115111.00, 'USD', '2021-10-26', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-08-06 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(37, 8, 2, 'Sample', 'Alumni123487', NULL, '224-123487M', '1999-11-28', 'female', '09663218938', NULL, 'Sample Address 123487', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.43, '2021', '2021-06-22', 'self_employed', 'Senior Engineer', 'Innovation Labs', NULL, NULL, 30221.00, 'USD', '2021-11-05', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-07-21 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(38, 11, 2, 'Sample', 'Alumni123488', NULL, '224-123488M', '1999-03-19', 'male', '09206228937', NULL, 'Sample Address 123488', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 2.00, '2021', '2021-06-13', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-07-01 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(39, 5, 2, 'Sample', 'Alumni123489', NULL, '224-123489M', '1999-12-18', 'male', '09242307288', NULL, 'Sample Address 123489', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 2.51, '2021', '2021-06-16', 'self_employed', 'Senior Engineer', 'Enterprise Solutions', NULL, NULL, 39038.00, 'USD', '2021-10-18', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-07-07 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(40, 4, 2, 'Sample', 'Alumni123490', NULL, '224-123490M', '1999-05-17', 'male', '09625415595', NULL, 'Sample Address 123490', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 1.88, '2021', '2021-06-15', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-06-22 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(41, 4, 2, 'Sample', 'Alumni123491', NULL, '224-123491M', '1999-04-25', 'male', '09411964178', NULL, 'Sample Address 123491', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 2.68, '2021', '2021-05-20', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-07-10 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(42, 11, 2, 'Sample', 'Alumni123492', NULL, '224-123492M', '1999-03-09', 'female', '09563908116', NULL, 'Sample Address 123492', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 1.83, '2021', '2021-06-01', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-07-10 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(43, 11, 2, 'Sample', 'Alumni123493', NULL, '224-123493M', '1999-05-14', 'female', '09988574278', NULL, 'Sample Address 123493', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 3.37, '2021', '2021-05-17', 'self_employed', 'Software Developer', 'Industry Leaders Co', NULL, NULL, 123276.00, 'USD', '2021-10-14', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-06-02 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(44, 5, 2, 'Sample', 'Alumni123494', NULL, '224-123494M', '1999-03-09', 'male', '09715465447', NULL, 'Sample Address 123494', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.69, '2021', '2021-06-25', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-07-08 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(45, 8, 2, 'Sample', 'Alumni123495', NULL, '224-123495M', '1999-09-22', 'male', '09943888335', NULL, 'Sample Address 123495', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 1.83, '2021', '2021-06-13', 'employed_part_time', 'Software Developer', 'Tech Solutions Inc', NULL, NULL, 44845.00, 'USD', '2021-11-27', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-07-13 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(46, 5, 2, 'Sample', 'Alumni123496', NULL, '224-123496M', '1999-09-04', 'female', '09609174428', NULL, 'Sample Address 123496', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 3.87, '2021', '2021-05-12', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-06-01 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(47, 4, 2, 'Sample', 'Alumni123497', NULL, '224-123497M', '1999-08-05', 'female', '09987017468', NULL, 'Sample Address 123497', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 1.90, '2021', '2021-06-28', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-07-30 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(48, 8, 2, 'Sample', 'Alumni123498', NULL, '224-123498M', '1999-04-08', 'female', '09860257974', NULL, 'Sample Address 123498', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 1.80, '2021', '2021-05-05', 'employed_full_time', 'Senior Engineer', 'Tech Solutions Inc', NULL, NULL, 143003.00, 'USD', '2021-11-06', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-05-20 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(49, 4, 2, 'Sample', 'Alumni123499', NULL, '224-123499M', '1999-10-01', 'male', '09775337230', NULL, 'Sample Address 123499', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.79, '2021', '2021-06-08', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-06-21 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(50, 4, 2, 'Sample', 'Alumni123500', NULL, '224-123500M', '1999-11-05', 'female', '09708297862', NULL, 'Sample Address 123500', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 3.58, '2021', '2021-06-12', 'self_employed', 'System Administrator', 'Startup Hub', NULL, NULL, 132340.00, 'USD', '2021-11-03', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-07-26 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(51, 8, 2, 'Sample', 'Alumni123501', NULL, '224-123501M', '1999-02-17', 'male', '09759223758', NULL, 'Sample Address 123501', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 2.72, '2021', '2021-06-05', 'employed_full_time', 'Data Analyst', 'Tech Solutions Inc', NULL, NULL, 31518.00, 'USD', '2021-10-22', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-06-12 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(52, 5, 2, 'Sample', 'Alumni123502', NULL, '224-123502M', '1999-06-09', 'female', '09892966993', NULL, 'Sample Address 123502', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 3.06, '2021', '2021-06-14', 'employed_full_time', 'Software Developer', 'Enterprise Solutions', NULL, NULL, 54674.00, 'USD', '2021-10-24', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-07-02 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(53, 8, 2, 'Sample', 'Alumni123503', NULL, '224-123503M', '1999-06-01', 'male', '09915656386', NULL, 'Sample Address 123503', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 3.94, '2021', '2021-05-24', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-07-03 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(54, 8, 2, 'Sample', 'Alumni123504', NULL, '224-123504M', '1999-11-24', 'male', '09740851221', NULL, 'Sample Address 123504', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 2.23, '2021', '2021-06-10', 'employed_part_time', 'Business Analyst', 'Tech Solutions Inc', NULL, NULL, 119703.00, 'USD', '2021-10-23', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2021-06-19 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(55, 11, 3, 'Sample', 'Alumni123505', NULL, '224-123505M', '2000-01-05', 'male', '09168474376', NULL, 'Sample Address 123505', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 2.50, '2022', '2022-06-13', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-07-22 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(56, 4, 3, 'Sample', 'Alumni123506', NULL, '224-123506M', '2000-10-07', 'male', '09399668982', NULL, 'Sample Address 123506', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 3.03, '2022', '2022-05-13', 'employed_part_time', 'IT Consultant', 'Digital Ventures', NULL, NULL, 38742.00, 'USD', '2022-10-13', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-06-03 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(57, 11, 3, 'Sample', 'Alumni123507', NULL, '224-123507M', '2000-04-14', 'male', '09939340978', NULL, 'Sample Address 123507', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 2.32, '2022', '2022-06-23', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-08-10 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(58, 4, 3, 'Sample', 'Alumni123508', NULL, '224-123508M', '2000-10-25', 'female', '09389543797', NULL, 'Sample Address 123508', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 1.64, '2022', '2022-05-15', 'employed_part_time', 'Senior Engineer', 'Tech Solutions Inc', NULL, NULL, 117531.00, 'USD', '2022-10-10', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-06-07 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(59, 5, 3, 'Sample', 'Alumni123509', NULL, '224-123509M', '2000-04-11', 'female', '09389739593', NULL, 'Sample Address 123509', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 2.11, '2022', '2022-06-22', 'self_employed', 'Software Developer', 'Industry Leaders Co', NULL, NULL, 112975.00, 'USD', '2022-11-06', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-06-22 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(60, 4, 3, 'Sample', 'Alumni123510', NULL, '224-123510M', '2000-04-09', 'male', '09856754243', NULL, 'Sample Address 123510', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 3.37, '2022', '2022-05-28', 'self_employed', 'Business Analyst', 'Industry Leaders Co', NULL, NULL, 82995.00, 'USD', '2022-12-05', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-07-20 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(61, 11, 3, 'Sample', 'Alumni123511', NULL, '224-123511M', '2000-01-11', 'female', '09806456225', NULL, 'Sample Address 123511', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 2.08, '2022', '2022-06-01', 'self_employed', 'System Administrator', 'Innovation Labs', NULL, NULL, 117633.00, 'USD', '2022-10-08', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-07-27 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(62, 5, 3, 'Sample', 'Alumni123512', NULL, '224-123512M', '2000-12-17', 'male', '09737737657', NULL, 'Sample Address 123512', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 3.74, '2022', '2022-05-28', 'employed_part_time', 'System Administrator', 'Enterprise Solutions', NULL, NULL, 148972.00, 'USD', '2022-11-09', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-06-01 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(63, 4, 3, 'Sample', 'Alumni123513', NULL, '224-123513M', '2000-10-12', 'male', '09316092795', NULL, 'Sample Address 123513', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 3.75, '2022', '2022-05-11', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-05-21 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(64, 5, 3, 'Sample', 'Alumni123514', NULL, '224-123514M', '2000-11-16', 'female', '09293108513', NULL, 'Sample Address 123514', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 2.26, '2022', '2022-06-21', 'employed_full_time', 'IT Consultant', 'Digital Ventures', NULL, NULL, 42620.00, 'USD', '2022-11-28', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-07-02 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(65, 4, 3, 'Sample', 'Alumni123515', NULL, '224-123515M', '2000-06-23', 'female', '09127418311', NULL, 'Sample Address 123515', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 3.71, '2022', '2022-05-07', 'self_employed', 'Software Developer', 'Global Systems Corp', NULL, NULL, 62481.00, 'USD', '2022-10-09', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-06-30 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(66, 5, 3, 'Sample', 'Alumni123516', NULL, '224-123516M', '2000-10-16', 'male', '09686043092', NULL, 'Sample Address 123516', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 3.61, '2022', '2022-05-02', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-05-16 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(67, 4, 3, 'Sample', 'Alumni123517', NULL, '224-123517M', '2000-01-28', 'female', '09997497035', NULL, 'Sample Address 123517', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 1.99, '2022', '2022-05-12', 'self_employed', 'Project Manager', 'Digital Ventures', NULL, NULL, 38698.00, 'USD', '2022-09-28', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-05-12 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(68, 5, 3, 'Sample', 'Alumni123518', NULL, '224-123518M', '2000-02-22', 'female', '09900179347', NULL, 'Sample Address 123518', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 3.87, '2022', '2022-05-28', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-07-24 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(69, 8, 3, 'Sample', 'Alumni123519', NULL, '224-123519M', '2000-11-26', 'female', '09354791235', NULL, 'Sample Address 123519', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 3.32, '2022', '2022-05-16', 'employed_part_time', 'Business Analyst', 'Industry Leaders Co', NULL, NULL, 81426.00, 'USD', '2022-09-11', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-06-13 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(70, 8, 3, 'Sample', 'Alumni123520', NULL, '224-123520M', '2000-10-27', 'male', '09641376932', NULL, 'Sample Address 123520', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 3.69, '2022', '2022-05-06', 'self_employed', 'Data Analyst', 'Startup Hub', NULL, NULL, 92692.00, 'USD', '2022-11-07', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-06-09 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(71, 11, 3, 'Sample', 'Alumni123521', NULL, '224-123521M', '2000-09-08', 'male', '09123237827', NULL, 'Sample Address 123521', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.72, '2022', '2022-05-10', 'employed_part_time', 'Software Developer', 'Global Systems Corp', NULL, NULL, 120719.00, 'USD', '2022-10-05', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-05-16 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(72, 4, 3, 'Sample', 'Alumni123522', NULL, '224-123522M', '2000-08-19', 'female', '09968194855', NULL, 'Sample Address 123522', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 2.99, '2022', '2022-05-26', 'self_employed', 'Project Manager', 'Global Systems Corp', NULL, NULL, 145149.00, 'USD', '2022-09-22', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-07-10 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(73, 4, 3, 'Sample', 'Alumni123523', NULL, '224-123523M', '2000-01-24', 'female', '09791645641', NULL, 'Sample Address 123523', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 3.03, '2022', '2022-06-28', 'employed_full_time', 'Senior Engineer', 'Enterprise Solutions', NULL, NULL, 98489.00, 'USD', '2022-10-22', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-07-31 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(74, 8, 3, 'Sample', 'Alumni123524', NULL, '224-123524M', '2000-07-11', 'female', '09490335402', NULL, 'Sample Address 123524', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 1.70, '2022', '2022-06-15', 'employed_full_time', 'System Administrator', 'Global Systems Corp', NULL, NULL, 54406.00, 'USD', '2022-12-04', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-07-23 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(75, 5, 3, 'Sample', 'Alumni123525', NULL, '224-123525M', '2000-08-23', 'male', '09798036189', NULL, 'Sample Address 123525', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 3.90, '2022', '2022-06-19', 'employed_part_time', 'Software Developer', 'Tech Solutions Inc', NULL, NULL, 92968.00, 'USD', '2022-10-02', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-06-23 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(76, 8, 3, 'Sample', 'Alumni123526', NULL, '224-123526M', '2000-07-09', 'male', '09823945524', NULL, 'Sample Address 123526', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 3.11, '2022', '2022-05-04', 'employed_full_time', 'System Administrator', 'Innovation Labs', NULL, NULL, 111591.00, 'USD', '2022-10-29', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-07-01 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(77, 8, 3, 'Sample', 'Alumni123527', NULL, '224-123527M', '2000-11-08', 'female', '09585396722', NULL, 'Sample Address 123527', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 2.15, '2022', '2022-05-27', 'self_employed', 'Data Analyst', 'Innovation Labs', NULL, NULL, 130093.00, 'USD', '2022-09-27', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-06-19 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(78, 11, 3, 'Sample', 'Alumni123528', NULL, '224-123528M', '2000-01-07', 'female', '09734237151', NULL, 'Sample Address 123528', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 1.61, '2022', '2022-06-04', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2022-07-13 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(79, 5, 4, 'Sample', 'Alumni123529', NULL, '224-123529M', '2001-03-07', 'female', '09133795027', NULL, 'Sample Address 123529', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 2.11, '2023', '2023-05-05', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-06-06 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(80, 5, 4, 'Sample', 'Alumni123530', NULL, '224-123530M', '2001-04-06', 'female', '09392886100', NULL, 'Sample Address 123530', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 2.54, '2023', '2023-05-14', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-05-19 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(81, 4, 4, 'Sample', 'Alumni123531', NULL, '224-123531M', '2001-12-27', 'female', '09194696195', NULL, 'Sample Address 123531', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 2.16, '2023', '2023-06-18', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-06-22 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(82, 8, 4, 'Sample', 'Alumni123532', NULL, '224-123532M', '2001-01-23', 'female', '09509997560', NULL, 'Sample Address 123532', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 3.00, '2023', '2023-05-05', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-06-05 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(83, 5, 4, 'Sample', 'Alumni123533', NULL, '224-123533M', '2001-02-04', 'male', '09197391105', NULL, 'Sample Address 123533', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 3.77, '2023', '2023-05-04', 'self_employed', 'Software Developer', 'Enterprise Solutions', NULL, NULL, 148875.00, 'USD', '2023-10-17', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-07-02 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(84, 8, 4, 'Sample', 'Alumni123534', NULL, '224-123534M', '2001-06-25', 'female', '09298749468', NULL, 'Sample Address 123534', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.25, '2023', '2023-06-02', 'employed_full_time', 'Senior Engineer', 'Enterprise Solutions', NULL, NULL, 97043.00, 'USD', '2023-10-03', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-06-14 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(85, 5, 4, 'Sample', 'Alumni123535', NULL, '224-123535M', '2001-06-20', 'male', '09672960705', NULL, 'Sample Address 123535', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 1.83, '2023', '2023-05-15', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-05-23 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(86, 11, 4, 'Sample', 'Alumni123536', NULL, '224-123536M', '2001-07-23', 'male', '09194454074', NULL, 'Sample Address 123536', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 3.41, '2023', '2023-06-27', 'employed_part_time', 'System Administrator', 'Startup Hub', NULL, NULL, 106360.00, 'USD', '2023-11-14', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-08-25 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(87, 11, 4, 'Sample', 'Alumni123537', NULL, '224-123537M', '2001-08-28', 'female', '09705400904', NULL, 'Sample Address 123537', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 3.86, '2023', '2023-05-12', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-05-17 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(88, 5, 4, 'Sample', 'Alumni123538', NULL, '224-123538M', '2001-02-21', 'male', '09640286466', NULL, 'Sample Address 123538', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 2.01, '2023', '2023-05-17', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-05-29 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(89, 4, 4, 'Sample', 'Alumni123539', NULL, '224-123539M', '2001-08-09', 'male', '09743471329', NULL, 'Sample Address 123539', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 3.06, '2023', '2023-05-12', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-07-08 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(90, 8, 4, 'Sample', 'Alumni123540', NULL, '224-123540M', '2001-07-06', 'male', '09671028734', NULL, 'Sample Address 123540', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 2.31, '2023', '2023-06-14', 'employed_part_time', 'System Administrator', 'Digital Ventures', NULL, NULL, 58648.00, 'USD', '2023-11-02', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-07-04 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(91, 11, 4, 'Sample', 'Alumni123541', NULL, '224-123541M', '2001-10-09', 'male', '09344755674', NULL, 'Sample Address 123541', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 1.70, '2023', '2023-05-19', 'employed_part_time', 'Data Analyst', 'Innovation Labs', NULL, NULL, 68468.00, 'USD', '2023-08-31', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-07-11 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(92, 11, 4, 'Sample', 'Alumni123542', NULL, '224-123542M', '2001-03-17', 'female', '09454884280', NULL, 'Sample Address 123542', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 3.16, '2023', '2023-06-08', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-06-16 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(93, 4, 4, 'Sample', 'Alumni123543', NULL, '224-123543M', '2001-12-04', 'male', '09720440072', NULL, 'Sample Address 123543', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 3.78, '2023', '2023-06-28', 'employed_full_time', 'Project Manager', 'Global Systems Corp', NULL, NULL, 57086.00, 'USD', '2023-11-29', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2023-08-08 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(94, 11, 5, 'Sample', 'Alumni123544', NULL, '224-123544M', '2002-12-22', 'female', '09280383530', NULL, 'Sample Address 123544', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.02, '2024', '2024-05-02', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-06-29 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(95, 4, 5, 'Sample', 'Alumni123545', NULL, '224-123545M', '2002-12-22', 'female', '09443905965', NULL, 'Sample Address 123545', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 1.64, '2024', '2024-05-27', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-07-20 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(96, 5, 5, 'Sample', 'Alumni123546', NULL, '224-123546M', '2002-11-09', 'male', '09168200440', NULL, 'Sample Address 123546', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 2.39, '2024', '2024-05-18', 'self_employed', 'Project Manager', 'Enterprise Solutions', NULL, NULL, 83692.00, 'USD', '2024-10-27', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-06-26 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(97, 5, 5, 'Sample', 'Alumni123547', NULL, '224-123547M', '2002-05-13', 'female', '09636619964', NULL, 'Sample Address 123547', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 1.86, '2024', '2024-06-06', 'employed_part_time', 'Senior Engineer', 'Industry Leaders Co', NULL, NULL, 66442.00, 'USD', '2024-10-18', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-07-06 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(98, 5, 5, 'Sample', 'Alumni123548', NULL, '224-123548M', '2002-10-03', 'male', '09655855684', NULL, 'Sample Address 123548', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 3.09, '2024', '2024-05-28', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-05-31 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(99, 8, 5, 'Sample', 'Alumni123549', NULL, '224-123549M', '2002-10-25', 'male', '09799842695', NULL, 'Sample Address 123549', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 1.93, '2024', '2024-06-26', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-08-13 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(100, 5, 5, 'Sample', 'Alumni123550', NULL, '224-123550M', '2002-06-21', 'male', '09754176384', NULL, 'Sample Address 123550', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.07, '2024', '2024-05-01', 'employed_full_time', 'IT Consultant', 'Startup Hub', NULL, NULL, 141232.00, 'USD', '2024-08-12', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-05-07 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(101, 4, 5, 'Sample', 'Alumni123551', NULL, '224-123551M', '2002-02-09', 'male', '09619484105', NULL, 'Sample Address 123551', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 2.73, '2024', '2024-05-22', 'self_employed', 'Project Manager', 'Tech Solutions Inc', NULL, NULL, 95610.00, 'USD', '2024-10-22', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-06-29 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(102, 11, 5, 'Sample', 'Alumni123552', NULL, '224-123552M', '2002-07-09', 'female', '09977565137', NULL, 'Sample Address 123552', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 3.20, '2024', '2024-05-16', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-05-30 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(103, 5, 5, 'Sample', 'Alumni123553', NULL, '224-123553M', '2002-12-17', 'female', '09820630952', NULL, 'Sample Address 123553', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 1.82, '2024', '2024-06-02', 'self_employed', 'IT Consultant', 'Enterprise Solutions', NULL, NULL, 114895.00, 'USD', '2024-10-18', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-06-23 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(104, 8, 5, 'Sample', 'Alumni123554', NULL, '224-123554M', '2002-08-14', 'female', '09455784463', NULL, 'Sample Address 123554', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 1.54, '2024', '2024-05-21', 'employed_part_time', 'System Administrator', 'Digital Ventures', NULL, NULL, 121231.00, 'USD', '2024-09-02', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-07-15 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(105, 5, 5, 'Sample', 'Alumni123555', NULL, '224-123555M', '2002-09-26', 'male', '09474607452', NULL, 'Sample Address 123555', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 2.89, '2024', '2024-06-06', 'employed_full_time', 'Senior Engineer', 'Startup Hub', NULL, NULL, 43955.00, 'USD', '2024-10-21', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-06-16 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(106, 11, 5, 'Sample', 'Alumni123556', NULL, '224-123556M', '2002-04-23', 'female', '09570100313', NULL, 'Sample Address 123556', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Engineering', 'N/A', NULL, 3.92, '2024', '2024-06-09', 'employed_part_time', 'Data Analyst', 'Industry Leaders Co', NULL, NULL, 63553.00, 'USD', '2024-09-07', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-08-05 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(107, 8, 5, 'Sample', 'Alumni123557', NULL, '224-123557M', '2002-02-14', 'female', '09376184853', NULL, 'Sample Address 123557', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.28, '2024', '2024-06-02', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-07-03 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(108, 4, 5, 'Sample', 'Alumni123558', NULL, '224-123558M', '2002-12-23', 'female', '09727796305', NULL, 'Sample Address 123558', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 1.71, '2024', '2024-05-06', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-06-10 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(109, 4, 5, 'Sample', 'Alumni123559', NULL, '224-123559M', '2002-05-08', 'female', '09248455546', NULL, 'Sample Address 123559', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 1.57, '2024', '2024-06-16', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2024-08-05 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(110, 11, 6, 'Sample', 'Alumni123560', NULL, '224-123560M', '2003-05-14', 'male', '09215386102', NULL, 'Sample Address 123560', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 3.76, '2025', '2025-05-26', 'employed_full_time', 'Software Developer', 'Global Systems Corp', NULL, NULL, 92745.00, 'USD', '2025-10-31', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-07-14 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08');
INSERT INTO `alumni_profiles` (`id`, `user_id`, `batch_id`, `first_name`, `last_name`, `middle_name`, `student_id`, `birth_date`, `gender`, `phone`, `alternate_email`, `current_address`, `city`, `state_province`, `postal_code`, `country`, `degree_program`, `major`, `minor`, `gpa`, `graduation_year`, `graduation_date`, `employment_status`, `current_job_title`, `current_employer`, `company_industry`, `company_size`, `current_salary`, `salary_currency`, `job_start_date`, `job_description`, `job_related_to_degree`, `skills`, `certifications`, `career_goals`, `feedback_to_institution`, `willing_to_mentor`, `willing_to_hire_alumni`, `profile_completed`, `profile_completed_at`, `created_at`, `updated_at`) VALUES
(111, 8, 6, 'Sample', 'Alumni123561', NULL, '224-123561M', '2003-06-22', 'female', '09972125143', NULL, 'Sample Address 123561', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 2.41, '2025', '2025-06-22', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-08-11 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(112, 5, 6, 'Sample', 'Alumni123562', NULL, '224-123562M', '2003-08-18', 'male', '09386888078', NULL, 'Sample Address 123562', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 1.97, '2025', '2025-06-22', 'employed_part_time', 'Project Manager', 'Industry Leaders Co', NULL, NULL, 63368.00, 'USD', '2025-10-14', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-07-27 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(113, 8, 6, 'Sample', 'Alumni123563', NULL, '224-123563M', '2003-10-19', 'female', '09438352631', NULL, 'Sample Address 123563', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 2.97, '2025', '2025-05-09', 'employed_full_time', 'Project Manager', 'Startup Hub', NULL, NULL, 114209.00, 'USD', '2025-08-24', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-05-14 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(114, 11, 6, 'Sample', 'Alumni123564', NULL, '224-123564M', '2003-08-25', 'male', '09651695683', NULL, 'Sample Address 123564', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Business Administration', 'N/A', NULL, 1.73, '2025', '2025-06-23', 'employed_part_time', 'Senior Engineer', 'Global Systems Corp', NULL, NULL, 125279.00, 'USD', '2025-09-28', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-08-17 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(115, 11, 6, 'Sample', 'Alumni123565', NULL, '224-123565M', '2003-05-26', 'male', '09105367452', NULL, 'Sample Address 123565', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 1.76, '2025', '2025-05-20', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-05-20 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(116, 5, 6, 'Sample', 'Alumni123566', NULL, '224-123566M', '2003-11-27', 'female', '09469290937', NULL, 'Sample Address 123566', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 2.71, '2025', '2025-06-08', 'employed_part_time', 'Project Manager', 'Innovation Labs', NULL, NULL, 143312.00, 'USD', '2025-09-28', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-06-25 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(117, 8, 6, 'Sample', 'Alumni123567', NULL, '224-123567M', '2003-12-13', 'male', '09838998389', NULL, 'Sample Address 123567', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 3.43, '2025', '2025-06-27', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-08-04 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(118, 4, 6, 'Sample', 'Alumni123568', NULL, '224-123568M', '2003-04-28', 'male', '09213717260', NULL, 'Sample Address 123568', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 2.97, '2025', '2025-05-15', 'employed_part_time', 'Business Analyst', 'Enterprise Solutions', NULL, NULL, 143481.00, 'USD', '2025-09-02', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-06-24 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(119, 11, 6, 'Sample', 'Alumni123569', NULL, '224-123569M', '2003-03-19', 'female', '09495893534', NULL, 'Sample Address 123569', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 1.51, '2025', '2025-05-22', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-06-13 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(120, 11, 6, 'Sample', 'Alumni123570', NULL, '224-123570M', '2003-12-24', 'male', '09816097295', NULL, 'Sample Address 123570', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.97, '2025', '2025-05-07', 'employed_full_time', 'Senior Engineer', 'Global Systems Corp', NULL, NULL, 89250.00, 'USD', '2025-09-07', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-06-30 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(121, 4, 6, 'Sample', 'Alumni123571', NULL, '224-123571M', '2003-06-03', 'male', '09463552596', NULL, 'Sample Address 123571', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.17, '2025', '2025-05-07', 'employed_full_time', 'System Administrator', 'Digital Ventures', NULL, NULL, 56362.00, 'USD', '2025-10-02', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-06-12 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(122, 11, 6, 'Sample', 'Alumni123572', NULL, '224-123572M', '2003-03-22', 'female', '09640975872', NULL, 'Sample Address 123572', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 3.62, '2025', '2025-05-25', 'self_employed', 'Data Analyst', 'Startup Hub', NULL, NULL, 91142.00, 'USD', '2025-09-10', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-07-05 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(123, 11, 6, 'Sample', 'Alumni123573', NULL, '224-123573M', '2003-01-05', 'female', '09878655331', NULL, 'Sample Address 123573', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 3.82, '2025', '2025-06-01', 'employed_full_time', 'Business Analyst', 'Startup Hub', NULL, NULL, 124153.00, 'USD', '2025-08-12', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-06-24 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(124, 5, 6, 'Sample', 'Alumni123574', NULL, '224-123574M', '2003-08-02', 'male', '09440442665', NULL, 'Sample Address 123574', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 2.21, '2025', '2025-05-01', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-06-17 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(125, 11, 6, 'Sample', 'Alumni123575', NULL, '224-123575M', '2003-08-20', 'male', '09885269444', NULL, 'Sample Address 123575', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 2.56, '2025', '2025-05-15', 'self_employed', 'Business Analyst', 'Innovation Labs', NULL, NULL, 63707.00, 'USD', '2025-08-26', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-05-17 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(126, 4, 6, 'Sample', 'Alumni123576', NULL, '224-123576M', '2003-05-16', 'male', '09566813602', NULL, 'Sample Address 123576', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.53, '2025', '2025-05-13', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-06-27 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(127, 4, 6, 'Sample', 'Alumni123577', NULL, '224-123577M', '2003-08-14', 'female', '09659561811', NULL, 'Sample Address 123577', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 2.79, '2025', '2025-05-19', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-06-07 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(128, 8, 6, 'Sample', 'Alumni123578', NULL, '224-123578M', '2003-06-24', 'female', '09526347952', NULL, 'Sample Address 123578', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 3.70, '2025', '2025-05-19', 'employed_full_time', 'Project Manager', 'Global Systems Corp', NULL, NULL, 33409.00, 'USD', '2025-09-26', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-06-18 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(129, 4, 6, 'Sample', 'Alumni123579', NULL, '224-123579M', '2003-03-01', 'male', '09872650650', NULL, 'Sample Address 123579', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Arts in Education', 'N/A', NULL, 1.52, '2025', '2025-06-05', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-06-28 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(130, 8, 6, 'Sample', 'Alumni123580', NULL, '224-123580M', '2003-03-24', 'female', '09582649012', NULL, 'Sample Address 123580', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 3.81, '2025', '2025-05-23', 'unemployed_seeking', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-06-28 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(131, 8, 6, 'Sample', 'Alumni123581', NULL, '224-123581M', '2003-06-13', 'male', '09308971528', NULL, 'Sample Address 123581', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Nursing', 'N/A', NULL, 2.41, '2025', '2025-06-19', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-08-07 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(132, 5, 6, 'Sample', 'Alumni123582', NULL, '224-123582M', '2003-03-19', 'male', '09571947914', NULL, 'Sample Address 123582', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science in Information Technology', 'N/A', NULL, 2.54, '2025', '2025-06-13', 'continuing_education', NULL, NULL, NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-07-19 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(133, 8, 6, 'Sample', 'Alumni123583', NULL, '224-123583M', '2003-06-11', 'male', '09903578445', NULL, 'Sample Address 123583', 'Sample City', NULL, NULL, 'Philippines', 'Bachelor of Science In Computer Science', 'N/A', NULL, 1.56, '2025', '2025-05-22', 'employed_full_time', 'Data Analyst', 'Tech Solutions Inc', NULL, NULL, 123978.00, 'USD', '2025-09-14', NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-07-01 16:00:00', '2025-10-01 01:39:08', '2025-10-01 01:39:08'),
(134, 16, 6, 'Jhon', 'Canalita', NULL, '224-168473M', '2003-02-04', 'male', '0951429898', NULL, 'Test', 'Test', NULL, NULL, 'Philippines', 'BS Computer Science', 'N/A', NULL, 1.60, '2025', NULL, 'employed_full_time', 'Software Engineer', 'AWS', NULL, NULL, NULL, 'USD', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 1, '2025-10-02 20:38:41', '2025-10-02 20:38:41', '2025-10-02 20:38:41');

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
(5, 'Class of 2024', '2024', 'Most recent graduates', 'active', '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(6, 'Class of 2025', '2025', NULL, 'active', '2025-09-17 21:57:15', '2025-09-17 21:57:15');

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
-- Table structure for table `email_templates`
--

CREATE TABLE `email_templates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `body` text NOT NULL,
  `category` varchar(100) NOT NULL,
  `type` enum('notification','reminder','announcement','survey','system') NOT NULL DEFAULT 'notification',
  `status` enum('active','inactive','draft') NOT NULL DEFAULT 'draft',
  `variables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`variables`)),
  `usage_count` int(11) NOT NULL DEFAULT 0,
  `last_sent_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_templates`
--

INSERT INTO `email_templates` (`id`, `name`, `subject`, `body`, `category`, `type`, `status`, `variables`, `usage_count`, `last_sent_at`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Welcome Email', 'Welcome to Alumni Tracer System, {{first_name}}!', '<h2>Welcome {{first_name}} {{last_name}}!</h2><p>Thank you for joining our Alumni Tracer System. We\'re excited to have you as part of our community.</p><p>Your account has been successfully created with the email: {{email}}</p><p>Best regards,<br>The Alumni Relations Team</p>', 'Onboarding', 'notification', 'active', '[\"first_name\",\"last_name\",\"email\"]', 45, '2025-09-29 01:09:25', 1, '2025-10-01 01:09:25', '2025-10-01 01:09:25'),
(2, 'Survey Invitation', 'You\'re invited to participate in our {{survey_title}}', '<h2>Hello {{first_name}}!</h2><p>We invite you to participate in our latest survey: <strong>{{survey_title}}</strong></p><p>Your feedback is valuable and helps us improve our services.</p><p>Click here to start: <a href=\"{{survey_link}}\">Take Survey</a></p><p>This survey will take approximately {{estimated_time}} minutes to complete.</p><p>Thank you for your time!</p>', 'Surveys', 'survey', 'active', '[\"first_name\",\"survey_title\",\"survey_link\",\"estimated_time\"]', 128, '2025-09-30 01:09:25', 1, '2025-10-01 01:09:25', '2025-10-01 01:09:25'),
(3, 'Survey Completion Thank You', 'Thank you for completing {{survey_title}}', '<h2>Thank you, {{first_name}}!</h2><p>We appreciate you taking the time to complete our survey: <strong>{{survey_title}}</strong></p><p>Your responses have been recorded and will help us better serve our alumni community.</p><p>Best regards,<br>Alumni Relations Team</p>', 'Surveys', 'notification', 'active', '[\"first_name\",\"survey_title\"]', 98, '2025-09-30 13:09:25', 1, '2025-10-01 01:09:25', '2025-10-01 01:09:25'),
(4, 'Survey Reminder', 'Reminder: Complete our {{survey_title}}', '<h2>Hi {{first_name}},</h2><p>This is a friendly reminder to complete our survey: <strong>{{survey_title}}</strong></p><p>You started this survey on {{start_date}} but haven\'t completed it yet.</p><p><a href=\"{{survey_link}}\">Continue Survey</a></p><p>The survey closes on {{deadline}}.</p>', 'Surveys', 'reminder', 'active', '[\"first_name\",\"survey_title\",\"survey_link\",\"start_date\",\"deadline\"]', 67, '2025-09-28 01:09:25', 1, '2025-10-01 01:09:25', '2025-10-01 01:09:25'),
(5, 'Alumni Event Announcement', 'Join us for {{event_name}}', '<h2>You\'re Invited!</h2><p>Dear {{first_name}},</p><p>We\'re excited to announce our upcoming event: <strong>{{event_name}}</strong></p><p><strong>Date:</strong> {{event_date}}<br><strong>Time:</strong> {{event_time}}<br><strong>Location:</strong> {{event_location}}</p><p>{{event_description}}</p><p><a href=\"{{rsvp_link}}\">RSVP Now</a></p>', 'Events', 'announcement', 'active', '[\"first_name\",\"event_name\",\"event_date\",\"event_time\",\"event_location\",\"event_description\",\"rsvp_link\"]', 234, '2025-09-24 01:09:25', 1, '2025-10-01 01:09:25', '2025-10-01 01:09:25'),
(6, 'Password Reset', 'Reset Your Password', '<h2>Password Reset Request</h2><p>Hi {{first_name}},</p><p>We received a request to reset your password. Click the link below to reset it:</p><p><a href=\"{{reset_link}}\">Reset Password</a></p><p>This link will expire in {{expiry_time}} hours.</p><p>If you didn\'t request this, please ignore this email.</p>', 'Account', 'system', 'active', '[\"first_name\",\"reset_link\",\"expiry_time\"]', 23, '2025-09-26 01:09:25', 1, '2025-10-01 01:09:25', '2025-10-01 01:09:25'),
(7, 'Profile Update Confirmation', 'Your profile has been updated', '<h2>Profile Updated Successfully</h2><p>Hello {{first_name}},</p><p>Your alumni profile has been successfully updated.</p><p><strong>Updated fields:</strong></p><ul>{{updated_fields}}</ul><p>If you didn\'t make these changes, please contact us immediately.</p>', 'Account', 'notification', 'active', '[\"first_name\",\"updated_fields\"]', 156, '2025-09-30 01:09:25', 1, '2025-10-01 01:09:25', '2025-10-01 01:09:25'),
(8, 'Monthly Newsletter', 'Alumni Newsletter - {{month}} {{year}}', '<h1>Alumni Newsletter</h1><h2>{{month}} {{year}}</h2><p>Dear {{first_name}},</p><p>Here\'s what\'s happening in our alumni community:</p>{{newsletter_content}}<p>Stay connected!</p>', 'Newsletter', 'announcement', 'draft', '[\"first_name\",\"month\",\"year\",\"newsletter_content\"]', 12, '2025-09-01 01:09:25', 1, '2025-10-01 01:09:25', '2025-10-01 01:09:25'),
(9, 'Job Opportunity Alert', 'New Job Opportunity: {{job_title}}', '<h2>New Job Opportunity</h2><p>Hi {{first_name}},</p><p>A new job opportunity that matches your profile has been posted:</p><p><strong>Position:</strong> {{job_title}}<br><strong>Company:</strong> {{company_name}}<br><strong>Location:</strong> {{job_location}}<br><strong>Type:</strong> {{job_type}}</p><p>{{job_description}}</p><p><a href=\"{{apply_link}}\">View Details & Apply</a></p>', 'Career', 'notification', 'inactive', '[\"first_name\",\"job_title\",\"company_name\",\"job_location\",\"job_type\",\"job_description\",\"apply_link\"]', 0, NULL, 1, '2025-10-01 01:09:25', '2025-10-01 01:09:25'),
(10, 'Account Deactivation Warning', 'Action Required: Your account will be deactivated', '<h2>Account Deactivation Warning</h2><p>Dear {{first_name}},</p><p>We notice you haven\'t logged in for {{inactive_days}} days. Your account will be automatically deactivated on {{deactivation_date}} due to inactivity.</p><p>To keep your account active, simply log in: <a href=\"{{login_link}}\">Login Now</a></p>', 'Account', 'reminder', 'draft', '[\"first_name\",\"inactive_days\",\"deactivation_date\",\"login_link\"]', 0, NULL, 1, '2025-10-01 01:09:25', '2025-10-01 01:09:25');

-- --------------------------------------------------------

--
-- Table structure for table `employments`
--

CREATE TABLE `employments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `alumni_id` bigint(20) UNSIGNED NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `position` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `salary` decimal(10,2) DEFAULT NULL,
  `industry` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `employment_type` enum('full-time','part-time','contract','freelance','internship') NOT NULL DEFAULT 'full-time',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
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
(16, '2025_09_10_065519_add_name_to_users_table', 3),
(17, '2025_09_15_051013_create_employments_table', 4),
(18, '2025_10_01_090557_create_email_templates_table', 5);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`email`, `token`, `created_at`) VALUES
('nacu.a.bscs@gmail.com', '$2y$12$ku9vJ.L3FSTT6iuRCpnepOJp/xw6ctRhXZ1Fkah9q6qERIu1s5xZS', '2025-09-30 21:39:30'),
('nacuadrian873@gmail.com', '$2y$12$LiaG3ugxx.IL0GEtkTEf3.in3X1pKy29cPg35iwC59sCTd8B6mNf2', '2025-09-30 23:14:25'),
('testadmin@example.com', '$2y$12$F93Hup1S7ny8C.NgO38rtO84a5OaaP0Q2rNhVMlJwNx4JQlkBQqCa', '2025-09-30 21:38:15');

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
(5, 'App\\Models\\User', 5, 'auth-token', '46c45fd9b7252ac1fd5e28a3578d7f28f18b1590ec5f0c6439351428d911b5a6', '[\"*\"]', '2025-09-14 04:51:16', NULL, '2025-09-10 20:45:23', '2025-09-14 04:51:16'),
(6, 'App\\Models\\User', 8, 'auth-token', '0134e25dc4da4dc9bd2d1e4b41c5f69285252b6c11f17b6a699c2583a954ac0d', '[\"*\"]', NULL, NULL, '2025-09-14 20:19:29', '2025-09-14 20:19:29'),
(7, 'App\\Models\\User', 8, 'auth-token', '4e782018966dc112522cdf6d39404786a9364882980e6f42bea0d3a43ab08249', '[\"*\"]', NULL, NULL, '2025-09-14 20:19:47', '2025-09-14 20:19:47'),
(8, 'App\\Models\\User', 8, 'auth-token', '22bbce13e7d2fdc272ee50a04a49cbc27023907929634b9ab7913a658cb81997', '[\"*\"]', NULL, NULL, '2025-09-14 20:48:45', '2025-09-14 20:48:45'),
(9, 'App\\Models\\User', 4, 'auth-token', 'b5078aca01e1446491170dfa45a1f0944375da6b01696996f3031e368c67f63a', '[\"*\"]', NULL, NULL, '2025-09-14 20:48:53', '2025-09-14 20:48:53'),
(10, 'App\\Models\\User', 8, 'auth-token', 'a80c56f0c62cd31114e89db00ff1d6a98de8123bfa5cdaef02cf1bd5368f9733', '[\"*\"]', NULL, NULL, '2025-09-14 21:13:06', '2025-09-14 21:13:06'),
(11, 'App\\Models\\User', 4, 'auth-token', '6471327dc082f4a708edcfc2c9851e53d3739ae5633080812b5a0abcc0b7da12', '[\"*\"]', NULL, NULL, '2025-09-14 21:22:56', '2025-09-14 21:22:56'),
(12, 'App\\Models\\User', 4, 'auth-token', '9af77833e075c462f530c8cb420e303d1673d496b281b451ca3e210ed12a7ead', '[\"*\"]', NULL, NULL, '2025-09-14 21:27:05', '2025-09-14 21:27:05'),
(13, 'App\\Models\\User', 10, 'auth-token', '0ca6a638cdefb71ee596fb41b8189d403a9ed73942ccaad03dc9299fd86c6a2d', '[\"*\"]', '2025-09-14 21:56:57', NULL, '2025-09-14 21:44:14', '2025-09-14 21:56:57'),
(14, 'App\\Models\\User', 10, 'auth-token', '37c28845a3620ede284342bd7f7720ce8021d1bac64a60437c3bf2959b4fa332', '[\"*\"]', NULL, NULL, '2025-09-14 22:26:20', '2025-09-14 22:26:20'),
(15, 'App\\Models\\User', 10, 'auth-token', '26a4b9e313849a0d829f0270e7780463e82653205b328b839409df0928e5f547', '[\"*\"]', NULL, NULL, '2025-09-14 22:26:30', '2025-09-14 22:26:30'),
(16, 'App\\Models\\User', 10, 'auth-token', 'bbd5f3688976bc98da0db9a2af1e2b1a6ee7f43bfaea284ec2df7d597c67d047', '[\"*\"]', NULL, NULL, '2025-09-14 22:27:55', '2025-09-14 22:27:55'),
(17, 'App\\Models\\User', 10, 'auth-token', '018c5c85ecb92e332ee453fd11a660bbad70926e450c47e2b2b0d89df5ca9a2d', '[\"*\"]', NULL, NULL, '2025-09-14 22:28:41', '2025-09-14 22:28:41'),
(18, 'App\\Models\\User', 10, 'auth-token', '914e329946d0d9cc8d3f3dbd332a518797dcb1444a1cbe12a99d50cdcab21b73', '[\"*\"]', NULL, NULL, '2025-09-14 22:28:48', '2025-09-14 22:28:48'),
(1946, 'App\\Models\\User', 13, 'web-session-token', 'ef6e739f303067f9e23a7e7df48e5837c09b905092c832a6ec7a27c35b3757f3', '[\"*\"]', '2025-09-18 01:22:34', NULL, '2025-09-17 18:04:37', '2025-09-18 01:22:34'),
(1947, 'App\\Models\\User', 1, 'test-token', 'f010da668c7febf1ba003cfbce79ff989dff4b4fd7d988a53dc9d8a2e962a262', '[\"*\"]', NULL, NULL, '2025-09-30 23:34:48', '2025-09-30 23:34:48'),
(1948, 'App\\Models\\User', 1, 'test-token', 'c9d921160ce517caab0a3823547cf48149f8278bd0c2d1a01b41b4cb35958d37', '[\"*\"]', NULL, NULL, '2025-09-30 23:36:41', '2025-09-30 23:36:41'),
(1949, 'App\\Models\\User', 1, 'test-token', '1a91f0bcc2a28e16eb46dd0cbe0386d789d1897bbbea87609a823332b156f07f', '[\"*\"]', NULL, NULL, '2025-09-30 23:37:17', '2025-09-30 23:37:17'),
(1950, 'App\\Models\\User', 1, 'test-token', '938a1e592ad38e2543216161526ff76a587078d729cd852edbe61cffbe81f2ea', '[\"*\"]', NULL, NULL, '2025-09-30 23:39:11', '2025-09-30 23:39:11'),
(1951, 'App\\Models\\User', 15, 'web-session-token', 'df673adb047efe8935009c45f2c9e87eb4d51509df05b2b6a628a80a2a363b84', '[\"*\"]', NULL, NULL, '2025-10-02 20:07:58', '2025-10-02 20:07:58'),
(1952, 'App\\Models\\User', 16, 'auth-token', '7ac9b8d24e26e1a6bafccf7c39059edd4a4a84034e2f99e8975351b562b9fc3c', '[\"*\"]', NULL, NULL, '2025-10-02 20:38:41', '2025-10-02 20:38:41');

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
('eprmBwsyZNX5at1zqJ3kfREtuNTpvvJCqxhFjMW6', 16, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'YTo2OntzOjY6Il90b2tlbiI7czo0MDoidWVSY3RXdHlTUnVYdDlTaUh3bkdXc0Q5NndRdlVMME5oWnVIc011TyI7czozOiJ1cmwiO2E6MDp7fXM6OToiX3ByZXZpb3VzIjthOjE6e3M6MzoidXJsIjtzOjQzOiJodHRwOi8vMTI3LjAuMC4xOjgwMDAvYXBpL3YxL2FsdW1uaS9wcm9maWxlIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTY7czoxNzoicGFzc3dvcmRfaGFzaF93ZWIiO3M6NjA6IiQyeSQxMiR2Rm85Z1UzVmJaQUx1aEdWQ1A1V0FlN1RUU1BTVlg0Z3ZRaXNHT2RHTVZJYTNmTHQ4aDRTUyI7fQ==', 1759468908),
('L7tSjrkUoeUNt2jBYdiKAZ6GOuygMu60Hsm5YKMD', 16, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'YTo1OntzOjY6Il90b2tlbiI7czo0MDoiTmc1UUFORWxYZ2k5Vk1WWGRPNmM4a0pYRkM5ajRYRWdRZGlxU2dVayI7czozOiJ1cmwiO2E6MDp7fXM6OToiX3ByZXZpb3VzIjthOjE6e3M6MzoidXJsIjtzOjMxOiJodHRwOi8vbG9jYWxob3N0OjgwMDAvZGFzaGJvYXJkIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTY7fQ==', 1759466768),
('LRiY6PUtItZxE1zXO6sMvIb2MPiBfF9CI5NdT9Co', 4, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'YTo1OntzOjY6Il90b2tlbiI7czo0MDoiUjVtT21TcGN4Y2k0Zm12QzdpSDZ2eHdqTDRoNWc1QldRMVNnaENoYiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MzE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9kYXNoYm9hcmQiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX1zOjUwOiJsb2dpbl93ZWJfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI7aTo0O3M6MTc6InBhc3N3b3JkX2hhc2hfd2ViIjtzOjYwOiIkMnkkMTIkZWd1Vy5WRHpUQmFWdmt2MUxSbmZVdUkuWGMuWUk4QUo3NkdVR3NqaFZ0STh4VVZYaWhWR08iO30=', 1759466899),
('uw7D6ANc9eCUMs40Vr9EUkM0eIuuAEi1qEs6wHFq', 15, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'YTo1OntzOjY6Il90b2tlbiI7czo0MDoiN2NXM1JQa1dhUHdkZTN5MzBlMU0wSERsVFZvcTVPTXNtaFFNUjZDdiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6MzQ6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9hbHVtbmkiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX1zOjUwOiJsb2dpbl93ZWJfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI7aToxNTtzOjE3OiJwYXNzd29yZF9oYXNoX3dlYiI7czo2MDoiJDJ5JDEyJHFVOGcxTktaOFZJa0hrcWxLWktiSk9HL2lGNUJwNXdjU204bDBGdTZGSWx3bGRSelJXdWx5Ijt9', 1759465622);

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
(1, 'Alumni Registration & Initial Survey', 'Welcome! This survey helps us collect your information and track your career progress.', 'Please fill out all required fields. This information will be used to create your alumni profile.', 'active', 'registration', NULL, NULL, NULL, NULL, 0, 0, 0, 1, 'Complete Your Alumni Registration', 'Dear Alumni, Please complete your registration by clicking the link below.', 0, 7, 0, 4, 0.00, 1, '2025-09-07 22:32:18', '2025-10-02 20:38:41'),
(3, 'Test', 'Test', NULL, 'draft', 'custom', '2025-09-18 00:00:00', '2025-09-19 00:00:00', '[]', '[]', 0, 0, 1, 0, NULL, NULL, 0, 7, 0, 0, 0.00, 13, '2025-09-17 23:23:04', '2025-09-17 23:23:04');

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
(100, 69, 22, 'Nacu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-10 20:45:20', NULL, 0, NULL, '2025-09-10 20:45:20', '2025-09-10 20:45:20'),
(101, 111, 1, 'test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:23', NULL, 0, NULL, '2025-09-14 20:19:23', '2025-09-14 20:19:23'),
(102, 111, 2, 'test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:23', NULL, 0, NULL, '2025-09-14 20:19:23', '2025-09-14 20:19:23'),
(103, 111, 3, '224-123123M', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:23', NULL, 0, NULL, '2025-09-14 20:19:23', '2025-09-14 20:19:23'),
(104, 111, 4, 'test3@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:23', NULL, 0, NULL, '2025-09-14 20:19:23', '2025-09-14 20:19:23'),
(105, 111, 5, '09763211128', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:24', NULL, 0, NULL, '2025-09-14 20:19:24', '2025-09-14 20:19:24'),
(106, 111, 6, NULL, NULL, NULL, '2004-05-06', NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:24', NULL, 0, NULL, '2025-09-14 20:19:24', '2025-09-14 20:19:24'),
(107, 111, 7, 'Male', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:24', NULL, 0, NULL, '2025-09-14 20:19:24', '2025-09-14 20:19:24'),
(108, 111, 8, 'BSCS', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:24', NULL, 0, NULL, '2025-09-14 20:19:24', '2025-09-14 20:19:24'),
(109, 111, 9, 'N/A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:25', NULL, 0, NULL, '2025-09-14 20:19:25', '2025-09-14 20:19:25'),
(110, 111, 10, NULL, NULL, 2025.0000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:25', NULL, 0, NULL, '2025-09-14 20:19:25', '2025-09-14 20:19:25'),
(111, 111, 11, NULL, NULL, 1.7000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:25', NULL, 0, NULL, '2025-09-14 20:19:25', '2025-09-14 20:19:25'),
(112, 111, 12, 'Employed Full-time', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:25', NULL, 0, NULL, '2025-09-14 20:19:25', '2025-09-14 20:19:25'),
(113, 111, 13, 'Software Engineer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:26', NULL, 0, NULL, '2025-09-14 20:19:26', '2025-09-14 20:19:26'),
(114, 111, 14, 'ARUP', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:26', NULL, 0, NULL, '2025-09-14 20:19:26', '2025-09-14 20:19:26'),
(115, 111, 15, NULL, NULL, 100000.0000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:26', NULL, 0, NULL, '2025-09-14 20:19:26', '2025-09-14 20:19:26'),
(116, 111, 16, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:27', NULL, 0, NULL, '2025-09-14 20:19:27', '2025-09-14 20:19:27'),
(117, 111, 17, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:27', NULL, 0, NULL, '2025-09-14 20:19:27', '2025-09-14 20:19:27'),
(118, 111, 18, 'Philippines', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:27', NULL, 0, NULL, '2025-09-14 20:19:27', '2025-09-14 20:19:27'),
(119, 111, 19, 'No', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:27', NULL, 0, NULL, '2025-09-14 20:19:27', '2025-09-14 20:19:27'),
(120, 111, 20, 'N/A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-14 20:19:28', NULL, 0, NULL, '2025-09-14 20:19:28', '2025-09-14 20:19:28'),
(121, 112, 1, 'Jhon', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:36', NULL, 0, NULL, '2025-10-02 20:38:36', '2025-10-02 20:38:36'),
(122, 112, 2, 'Canalita', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:36', NULL, 0, NULL, '2025-10-02 20:38:36', '2025-10-02 20:38:36'),
(123, 112, 3, '224-168473M', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:36', NULL, 0, NULL, '2025-10-02 20:38:36', '2025-10-02 20:38:36'),
(124, 112, 4, 'canalita@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:37', NULL, 0, NULL, '2025-10-02 20:38:37', '2025-10-02 20:38:37'),
(125, 112, 5, '0951429898', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:37', NULL, 0, NULL, '2025-10-02 20:38:37', '2025-10-02 20:38:37'),
(126, 112, 6, NULL, NULL, NULL, '2003-02-04', NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:37', NULL, 0, NULL, '2025-10-02 20:38:37', '2025-10-02 20:38:37'),
(127, 112, 7, 'Male', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:37', NULL, 0, NULL, '2025-10-02 20:38:37', '2025-10-02 20:38:37'),
(128, 112, 8, 'BS Computer Science', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:37', NULL, 0, NULL, '2025-10-02 20:38:37', '2025-10-02 20:38:37'),
(129, 112, 9, 'N/A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:38', NULL, 0, NULL, '2025-10-02 20:38:38', '2025-10-02 20:38:38'),
(130, 112, 10, NULL, NULL, 2025.0000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:38', NULL, 0, NULL, '2025-10-02 20:38:38', '2025-10-02 20:38:38'),
(131, 112, 11, NULL, NULL, 1.6000, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:38', NULL, 0, NULL, '2025-10-02 20:38:38', '2025-10-02 20:38:38'),
(132, 112, 12, 'Employed Full-time', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:39', NULL, 0, NULL, '2025-10-02 20:38:39', '2025-10-02 20:38:39'),
(133, 112, 13, 'Software Engineer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:39', NULL, 0, NULL, '2025-10-02 20:38:39', '2025-10-02 20:38:39'),
(134, 112, 14, 'AWS', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:39', NULL, 0, NULL, '2025-10-02 20:38:39', '2025-10-02 20:38:39'),
(135, 112, 16, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:39', NULL, 0, NULL, '2025-10-02 20:38:39', '2025-10-02 20:38:39'),
(136, 112, 17, 'Test', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:40', NULL, 0, NULL, '2025-10-02 20:38:40', '2025-10-02 20:38:40'),
(137, 112, 18, 'Philippines', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:40', NULL, 0, NULL, '2025-10-02 20:38:40', '2025-10-02 20:38:40'),
(138, 112, 19, 'No', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-02 20:38:40', NULL, 0, NULL, '2025-10-02 20:38:40', '2025-10-02 20:38:40');

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
(22, 1, 'Confirm Password', NULL, 'text', NULL, NULL, 1, 22, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-07 22:32:18', '2025-09-07 22:32:18'),
(23, 3, 'Name', NULL, 'text', '[]', NULL, 0, 1, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-17 23:23:05', '2025-09-17 23:23:05'),
(24, 3, 'Employee Number', NULL, 'text', '[]', NULL, 0, 2, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-17 23:23:05', '2025-09-17 23:23:05');

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
(110, 1, NULL, 'tpzjnWcZKp4kl9YdhjHZWc3jfwyXTSnGtfXX6IJu', 'in_progress', '2025-09-14 18:36:30', NULL, '2025-09-15 02:36:30', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', NULL, 22, 0, 0.00, NULL, 1, '2025-09-14 18:36:30', '2025-09-14 18:36:30'),
(111, 1, 8, '6tnBkkBPTxMm9DT0Uf3jrIhsTs8ttEC4icIV9858', 'completed', '2025-09-14 20:19:22', '2025-09-14 20:19:29', '2025-09-15 04:19:29', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1', NULL, 22, 20, 100.00, NULL, 1, '2025-09-14 20:19:22', '2025-09-14 20:19:29'),
(112, 1, 16, 'loWiN70Ks2KGyWGp9R2xDHxGtsJkBrF16uMb7bDS', 'completed', '2025-10-02 20:38:35', '2025-10-02 20:38:41', '2025-10-03 04:38:41', NULL, NULL, NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', NULL, 22, 18, 100.00, NULL, 1, '2025-10-02 20:38:35', '2025-10-02 20:38:41');

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
(1, NULL, 'admin@alumnitracer.edu', '2025-09-08 00:41:59', '$2y$12$mJb42XHjrznMc7/7bnH2QeAZvLUaFLmGYWNMHOH0z3Ren2TgyvOPK', 'admin', 'active', NULL, '2025-09-07 22:32:17', '2025-09-14 21:42:00'),
(4, 'Adrian Nacu', 'nacu.a.bscs@gmail.com', NULL, '$2y$12$eguW.VDzTBaVvkv1LRnfUuI.Xc.YI8AJ76GUGsjhVtI8xUVXihVGO', 'alumni', 'active', 'xpAudOYSnKCOQf7172qJYxiWZM7S9vpoffyhzT6vizE7W2TQ5hrIMFGZ2YLs', '2025-09-10 19:26:45', '2025-09-10 19:26:45'),
(5, 'Test Test', 'test@gmail.com', NULL, '$2y$12$/Ot1nO/1ASq7tWG6vgPYN.rqQkxRuOHJEk56eRcB/iipBLuAr1uWu', 'alumni', 'active', NULL, '2025-09-10 20:45:22', '2025-09-10 20:45:22'),
(6, 'Admin User', 'admin@alumni.com', '2025-09-13 22:47:04', '$2y$12$.W/yBwj85ILS8tNCNDBRiOaJy/Ll7H5u8am.JCDvr57lMHwUGpvHe', 'admin', 'active', NULL, '2025-09-13 22:47:04', '2025-09-13 22:47:04'),
(7, 'Admin User', 'admin@test.com', NULL, '$2y$12$WltqJ2zKQBvzaSXeRspZUeGIzBXtxi6d./3kps5GTosvIv7SDde6q', 'admin', 'active', 'yXcbqhOX2vShzMXJoIZ8V4AehlvCCTfVg8nIS3kz1LajyhE8RkXCyhOxlXEv', '2025-09-13 23:24:52', '2025-09-14 22:35:00'),
(8, NULL, 'test3@gmail.com', NULL, '$2y$12$HD.OfshjoLrcrHvMaaktMOXMD8vLCcB.3aanas4ESmg7z3D5eVLPi', 'alumni', 'active', NULL, '2025-09-14 20:19:29', '2025-09-14 20:19:29'),
(10, NULL, 'admin@admin.com', NULL, '$2y$12$DafXEDUEQFprSN5Yoz.3JOD73LKjuz866FjM4LS3sU9w.GkVxHlL6', 'admin', 'active', NULL, '2025-09-14 21:37:08', '2025-09-15 04:58:07'),
(11, NULL, 'alumni@test.com', NULL, '$2y$12$h0PygzTPCUeasyomIbL7PuGizBwh6fmcTxEGOvM9cveQft1iqn28i', 'alumni', 'pending', NULL, '2025-09-14 22:35:13', '2025-09-14 22:35:13'),
(13, NULL, 'testadmin@example.com', NULL, '$2y$12$IQfmIHIhzFV1NViPoXiXYuLG83q0gFzac/YXoaI6baJZLNUhborva', 'admin', 'pending', NULL, '2025-09-15 04:16:43', '2025-09-15 04:16:43'),
(15, 'Adrian Nacu', 'nacuadrian873@gmail.com', NULL, '$2y$12$qU8g1NKZ8VIkHkqlKZKbJOG/iF5Bp5wcSm8l0Fu6FIlwldRzRWuly', 'admin', 'active', NULL, '2025-09-30 23:13:35', '2025-09-30 23:13:35'),
(16, NULL, 'canalita@gmail.com', NULL, '$2y$12$vFo9gU3VbZALuhGVCP5WAe7TTSPSVX4gvQisGOdGMVIa3fLt8h4SS', 'alumni', 'active', NULL, '2025-10-02 20:38:41', '2025-10-02 20:38:41');

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
-- Indexes for table `email_templates`
--
ALTER TABLE `email_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email_templates_name_unique` (`name`),
  ADD KEY `email_templates_created_by_foreign` (`created_by`),
  ADD KEY `email_templates_category_index` (`category`),
  ADD KEY `email_templates_type_index` (`type`),
  ADD KEY `email_templates_status_index` (`status`);

--
-- Indexes for table `employments`
--
ALTER TABLE `employments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employments_alumni_id_foreign` (`alumni_id`);

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `admin_settings`
--
ALTER TABLE `admin_settings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `alumni_profiles`
--
ALTER TABLE `alumni_profiles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=135;

--
-- AUTO_INCREMENT for table `batches`
--
ALTER TABLE `batches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `email_templates`
--
ALTER TABLE `email_templates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `employments`
--
ALTER TABLE `employments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1953;

--
-- AUTO_INCREMENT for table `surveys`
--
ALTER TABLE `surveys`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `survey_answers`
--
ALTER TABLE `survey_answers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=139;

--
-- AUTO_INCREMENT for table `survey_invitations`
--
ALTER TABLE `survey_invitations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `survey_questions`
--
ALTER TABLE `survey_questions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `survey_responses`
--
ALTER TABLE `survey_responses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=113;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

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
-- Constraints for table `email_templates`
--
ALTER TABLE `email_templates`
  ADD CONSTRAINT `email_templates_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `employments`
--
ALTER TABLE `employments`
  ADD CONSTRAINT `employments_alumni_id_foreign` FOREIGN KEY (`alumni_id`) REFERENCES `alumni_profiles` (`id`) ON DELETE CASCADE;

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
