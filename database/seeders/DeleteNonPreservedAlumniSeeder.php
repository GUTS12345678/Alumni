<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class DeleteNonPreservedAlumniSeeder extends Seeder
{
    /**
     * Accounts to PRESERVE (will NOT be deleted)
     */
    private array $preserveEmails = [
        'nacu.a.bscs@gmail.com',
        'adriankurtnacu@gmail.com',
    ];

    /**
     * Delete all alumni except the 2 preserved accounts
     * Handles cascading deletions in correct order
     */
    public function run(): void
    {
        echo "\n╔══════════════════════════════════════════════════════════════╗\n";
        echo "║              ALUMNI DATA DELETION                            ║\n";
        echo "║        ⚠️  THIS ACTION CANNOT BE UNDONE! ⚠️                   ║\n";
        echo "╚══════════════════════════════════════════════════════════════╝\n\n";

        // Verify preserved accounts exist
        echo "⏳ Verifying preserved accounts...\n";
        
        $preserveUsers = User::whereIn('email', $this->preserveEmails)->get();

        if ($preserveUsers->count() !== 2) {
            echo "❌ ERROR: Could not find both accounts to preserve!\n";
            echo "   Expected: " . implode(', ', $this->preserveEmails) . "\n";
            echo "   Found: " . $preserveUsers->pluck('email')->implode(', ') . "\n\n";
            throw new \Exception("CRITICAL: Missing preserved accounts!");
        }

        $preserveUserIds = $preserveUsers->pluck('id')->toArray();
        echo "✅ Found accounts to preserve:\n";
        foreach ($preserveUsers as $user) {
            echo "   - {$user->email} (ID: {$user->id})\n";
        }
        echo "\n";

        // Get alumni profile IDs to preserve
        $preserveAlumniIds = DB::table('alumni_profiles')
            ->whereIn('user_id', $preserveUserIds)
            ->pluck('id')
            ->toArray();

        if (count($preserveAlumniIds) > 0) {
            echo "✅ Found alumni profiles to preserve: " . implode(', ', $preserveAlumniIds) . "\n\n";
        }

        // Show what will be deleted
        $willDelete = [
            'employments' => DB::table('employments')
                ->whereNotIn('alumni_id', $preserveAlumniIds)
                ->count(),
            'survey_responses' => DB::table('survey_responses')
                ->whereNotIn('user_id', $preserveUserIds)
                ->count(),
            'job_applications' => DB::table('job_applications')
                ->whereNotIn('user_id', $preserveUserIds)
                ->count(),
            'messages' => DB::table('messages')
                ->where(function($query) use ($preserveUserIds) {
                    $query->whereNotIn('sender_id', $preserveUserIds)
                          ->orWhereNotIn('recipient_id', $preserveUserIds);
                })
                ->count(),
            'activity_logs' => DB::table('activity_logs')
                ->whereNotIn('user_id', $preserveUserIds)
                ->count(),
            'alumni_profiles' => DB::table('alumni_profiles')
                ->whereNotIn('user_id', $preserveUserIds)
                ->count(),
            'users' => DB::table('users')
                ->whereNotIn('id', $preserveUserIds)
                ->where('role', 'alumni')
                ->count(),
        ];

        echo "⚠️ DELETION PREVIEW:\n";
        foreach ($willDelete as $table => $count) {
            echo "   - {$table}: {$count} records\n";
        }
        echo "\n";

        // Begin deletion (cascading order)
        echo "🗑️ Starting cascading deletion...\n\n";

        // Step 1: Delete employment records
        echo "⏳ [1/7] Deleting employment records...\n";
        $deleted = DB::table('employments')
            ->whereNotIn('alumni_id', $preserveAlumniIds)
            ->delete();
        echo "✅ Deleted {$deleted} employment records\n\n";

        // Step 2: Delete survey responses
        echo "⏳ [2/7] Deleting survey responses...\n";
        $deleted = DB::table('survey_responses')
            ->whereNotIn('user_id', $preserveUserIds)
            ->delete();
        echo "✅ Deleted {$deleted} survey responses\n\n";

        // Step 3: Delete job applications
        echo "⏳ [3/7] Deleting job applications...\n";
        $deleted = DB::table('job_applications')
            ->whereNotIn('user_id', $preserveUserIds)
            ->delete();
        echo "✅ Deleted {$deleted} job applications\n\n";

        // Step 4: Delete messages
        echo "⏳ [4/7] Deleting messages...\n";
        $deleted = DB::table('messages')
            ->where(function($query) use ($preserveUserIds) {
                $query->whereNotIn('sender_id', $preserveUserIds)
                      ->orWhereNotIn('recipient_id', $preserveUserIds);
            })
            ->delete();
        echo "✅ Deleted {$deleted} messages\n\n";

        // Step 5: Delete activity logs
        echo "⏳ [5/7] Deleting activity logs...\n";
        $deleted = DB::table('activity_logs')
            ->whereNotIn('user_id', $preserveUserIds)
            ->delete();
        echo "✅ Deleted {$deleted} activity logs\n\n";

        // Step 6: Delete alumni profiles
        echo "⏳ [6/7] Deleting alumni profiles...\n";
        $deleted = DB::table('alumni_profiles')
            ->whereNotIn('user_id', $preserveUserIds)
            ->delete();
        echo "✅ Deleted {$deleted} alumni profiles\n\n";

        // Step 7: Delete user accounts (only alumni role)
        echo "⏳ [7/7] Deleting user accounts (alumni only)...\n";
        $deleted = DB::table('users')
            ->whereNotIn('id', $preserveUserIds)
            ->where('role', 'alumni')
            ->delete();
        echo "✅ Deleted {$deleted} user accounts\n\n";

        // Verification
        echo "╔══════════════════════════════════════════════════════════════╗\n";
        echo "║                  DELETION COMPLETE                           ║\n";
        echo "╚══════════════════════════════════════════════════════════════╝\n\n";

        $remaining = [
            'users' => DB::table('users')->where('role', 'alumni')->count(),
            'alumni_profiles' => DB::table('alumni_profiles')->count(),
            'employments' => DB::table('employments')->count(),
            'survey_responses' => DB::table('survey_responses')->count(),
            'job_applications' => DB::table('job_applications')->count(),
        ];

        echo "Remaining Records:\n";
        foreach ($remaining as $table => $count) {
            echo "   - {$table}: {$count}\n";
        }
        echo "\n";

        // Final validation
        if ($remaining['users'] !== 2 || $remaining['alumni_profiles'] < 2) {
            echo "⚠️ WARNING: Unexpected number of remaining records!\n";
            echo "   Expected 2 users and 2+ alumni profiles\n";
            echo "   Please verify manually!\n\n";
        } else {
            echo "✅ Verification passed: 2 preserved accounts remain\n";
            echo "✅ Ready for new alumni data seeding\n\n";
        }

        echo "Preserved Accounts:\n";
        foreach ($preserveUsers as $user) {
            $profile = DB::table('alumni_profiles')->where('user_id', $user->id)->first();
            echo "   - {$user->email}\n";
            if ($profile) {
                echo "     Profile: {$profile->first_name} {$profile->last_name}\n";
                echo "     Campus: " . ($profile->campus_id == 1 ? 'Main' : 'Cavite') . "\n";
            }
        }
        echo "\n";
    }
}
