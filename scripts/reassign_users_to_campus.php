<?php
/**
 * Reassign Users to Different Campuses
 * 
 * This script allows you to reassign users to different campuses for testing.
 * 
 * Usage:
 *   php scripts/reassign_users_to_campus.php --list              # List all users
 *   php scripts/reassign_users_to_campus.php --random 10 --campus CAV   # Random 10 users to Cavite
 *   php scripts/reassign_users_to_campus.php --user 5 --campus CAV      # Specific user ID to Cavite
 *   php scripts/reassign_users_to_campus.php --range 1-50 --campus CAV  # User IDs 1-50 to Cavite
 *   php scripts/reassign_users_to_campus.php --stats             # Show campus statistics
 *   php scripts/reassign_users_to_campus.php --reset             # Reset all users to Main Campus
 */

// Bootstrap Laravel
require_once __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Campus;

class CampusReassigner
{
    private $mainCampusId;
    private $caviteCampusId;
    
    public function __construct()
    {
        // Get campus IDs
        $mainCampus = Campus::where('code', 'MAIN')->first();
        $caviteCampus = Campus::where('code', 'CAV')->first();
        
        if (!$mainCampus || !$caviteCampus) {
            $this->error("❌ Campuses not found! Make sure MAIN and CAV campuses exist.");
            exit(1);
        }
        
        $this->mainCampusId = $mainCampus->id;
        $this->caviteCampusId = $caviteCampus->id;
    }
    
    public function run($args)
    {
        echo "\n";
        echo "╔═══════════════════════════════════════════════════════════╗\n";
        echo "║       CAMPUS USER REASSIGNMENT TOOL                       ║\n";
        echo "║       EARIST Alumni Tracer System                         ║\n";
        echo "╚═══════════════════════════════════════════════════════════╝\n\n";
        
        // Parse arguments
        if (in_array('--help', $args) || in_array('-h', $args) || count($args) < 2) {
            $this->showHelp();
            return;
        }
        
        if (in_array('--stats', $args)) {
            $this->showStats();
            return;
        }
        
        if (in_array('--list', $args)) {
            $this->listUsers();
            return;
        }
        
        if (in_array('--reset', $args)) {
            $this->resetAllToMain();
            return;
        }
        
        // Get target campus
        $campusCode = $this->getArgValue($args, '--campus') ?? 'CAV';
        $targetCampusId = $campusCode === 'MAIN' ? $this->mainCampusId : $this->caviteCampusId;
        $campusName = $campusCode === 'MAIN' ? 'Main Campus' : 'Cavite Campus';
        
        // Random reassignment
        if (in_array('--random', $args)) {
            $count = (int) $this->getArgValue($args, '--random') ?: 10;
            $this->reassignRandom($count, $targetCampusId, $campusName);
            return;
        }
        
        // Specific user
        if (in_array('--user', $args)) {
            $userId = (int) $this->getArgValue($args, '--user');
            $this->reassignUser($userId, $targetCampusId, $campusName);
            return;
        }
        
        // Range of users
        if (in_array('--range', $args)) {
            $range = $this->getArgValue($args, '--range');
            $this->reassignRange($range, $targetCampusId, $campusName);
            return;
        }
        
        $this->showHelp();
    }
    
    private function showHelp()
    {
        echo "USAGE:\n";
        echo "  php scripts/reassign_users_to_campus.php [OPTIONS]\n\n";
        echo "OPTIONS:\n";
        echo "  --stats                    Show campus statistics\n";
        echo "  --list                     List all users with their campus\n";
        echo "  --random <count>           Reassign random users (default: 10)\n";
        echo "  --user <id>                Reassign specific user by ID\n";
        echo "  --range <start-end>        Reassign range of user IDs (e.g., 1-50)\n";
        echo "  --campus <code>            Target campus: MAIN or CAV (default: CAV)\n";
        echo "  --reset                    Reset ALL users back to Main Campus\n";
        echo "  --help, -h                 Show this help message\n\n";
        echo "EXAMPLES:\n";
        echo "  php scripts/reassign_users_to_campus.php --stats\n";
        echo "  php scripts/reassign_users_to_campus.php --random 20 --campus CAV\n";
        echo "  php scripts/reassign_users_to_campus.php --user 15 --campus CAV\n";
        echo "  php scripts/reassign_users_to_campus.php --range 1-25 --campus CAV\n";
        echo "  php scripts/reassign_users_to_campus.php --reset\n\n";
    }
    
    private function showStats()
    {
        echo "📊 CAMPUS STATISTICS\n";
        echo "═══════════════════════════════════════════════════════════\n\n";
        
        $stats = DB::table('users')
            ->join('campuses', 'users.campus_id', '=', 'campuses.id')
            ->select('campuses.id', 'campuses.name', 'campuses.code', DB::raw('COUNT(*) as user_count'))
            ->groupBy('campuses.id', 'campuses.name', 'campuses.code')
            ->get();
        
        $total = 0;
        foreach ($stats as $campus) {
            $total += $campus->user_count;
            $bar = str_repeat('█', min(50, (int)($campus->user_count / 5)));
            echo sprintf("  %-25s [%s] %d users\n", 
                $campus->name . " ({$campus->code})", 
                $campus->code,
                $campus->user_count
            );
            echo "  " . $bar . "\n\n";
        }
        
        echo "───────────────────────────────────────────────────────────\n";
        echo "  TOTAL USERS: $total\n\n";
        
        // Show role breakdown per campus
        echo "📋 ROLE BREAKDOWN BY CAMPUS\n";
        echo "───────────────────────────────────────────────────────────\n\n";
        
        $roleStats = DB::table('users')
            ->join('campuses', 'users.campus_id', '=', 'campuses.id')
            ->select('campuses.code', 'users.role', DB::raw('COUNT(*) as count'))
            ->groupBy('campuses.code', 'users.role')
            ->orderBy('campuses.code')
            ->orderBy('users.role')
            ->get();
        
        $currentCampus = '';
        foreach ($roleStats as $stat) {
            if ($currentCampus !== $stat->code) {
                if ($currentCampus !== '') echo "\n";
                $currentCampus = $stat->code;
                $campusName = $stat->code === 'MAIN' ? 'Main Campus' : 'Cavite Campus';
                echo "  {$campusName}:\n";
            }
            echo sprintf("    %-15s: %d users\n", ucfirst($stat->role ?? 'alumni'), $stat->count);
        }
        echo "\n";
    }
    
    private function listUsers()
    {
        echo "📋 USER LIST (First 50 users)\n";
        echo "═══════════════════════════════════════════════════════════\n\n";
        
        $users = DB::table('users')
            ->join('campuses', 'users.campus_id', '=', 'campuses.id')
            ->select('users.id', 'users.name', 'users.email', 'users.role', 'campuses.code as campus_code')
            ->orderBy('users.id')
            ->limit(50)
            ->get();
        
        echo sprintf("  %-5s %-30s %-35s %-10s %-6s\n", 'ID', 'NAME', 'EMAIL', 'ROLE', 'CAMPUS');
        echo "  " . str_repeat('-', 90) . "\n";
        
        foreach ($users as $user) {
            echo sprintf("  %-5d %-30s %-35s %-10s %-6s\n", 
                $user->id, 
                substr($user->name, 0, 28),
                substr($user->email, 0, 33),
                $user->role ?? 'alumni',
                $user->campus_code
            );
        }
        
        $totalUsers = DB::table('users')->count();
        if ($totalUsers > 50) {
            echo "\n  ... and " . ($totalUsers - 50) . " more users\n";
        }
        echo "\n";
    }
    
    private function reassignRandom($count, $targetCampusId, $campusName)
    {
        echo "🎲 RANDOM REASSIGNMENT\n";
        echo "═══════════════════════════════════════════════════════════\n\n";
        echo "  Target: $campusName\n";
        echo "  Count: $count users\n\n";
        
        // Get random users currently NOT in target campus
        $users = User::where('campus_id', '!=', $targetCampusId)
            ->inRandomOrder()
            ->limit($count)
            ->get();
        
        if ($users->isEmpty()) {
            echo "  ⚠️ No users available to reassign!\n";
            echo "  All users might already be in $campusName.\n\n";
            return;
        }
        
        echo "  Reassigning users:\n";
        echo "  " . str_repeat('-', 55) . "\n";
        
        $reassigned = 0;
        foreach ($users as $user) {
            $user->campus_id = $targetCampusId;
            $user->save();
            
            // Also update alumni_profile if exists
            DB::table('alumni_profiles')
                ->where('user_id', $user->id)
                ->update(['campus_id' => $targetCampusId]);
            
            echo sprintf("  ✅ ID: %-5d %-30s → %s\n", 
                $user->id, 
                substr($user->name, 0, 28),
                $campusName
            );
            $reassigned++;
        }
        
        echo "\n  ═══════════════════════════════════════════════════════════\n";
        echo "  ✅ Successfully reassigned $reassigned users to $campusName\n\n";
        
        $this->showStats();
    }
    
    private function reassignUser($userId, $targetCampusId, $campusName)
    {
        echo "👤 SINGLE USER REASSIGNMENT\n";
        echo "═══════════════════════════════════════════════════════════\n\n";
        
        $user = User::find($userId);
        
        if (!$user) {
            echo "  ❌ User ID $userId not found!\n\n";
            return;
        }
        
        $oldCampus = Campus::find($user->campus_id);
        $oldCampusName = $oldCampus ? $oldCampus->name : 'Unknown';
        
        echo "  User Details:\n";
        echo "  ─────────────────────────────────────────────────────────\n";
        echo "  ID:      $user->id\n";
        echo "  Name:    $user->name\n";
        echo "  Email:   $user->email\n";
        echo "  Role:    " . ($user->role ?? 'alumni') . "\n";
        echo "  Current: $oldCampusName\n";
        echo "  Target:  $campusName\n\n";
        
        $user->campus_id = $targetCampusId;
        $user->save();
        
        // Also update alumni_profile if exists
        DB::table('alumni_profiles')
            ->where('user_id', $user->id)
            ->update(['campus_id' => $targetCampusId]);
        
        echo "  ✅ Successfully reassigned to $campusName!\n\n";
    }
    
    private function reassignRange($range, $targetCampusId, $campusName)
    {
        echo "📋 RANGE REASSIGNMENT\n";
        echo "═══════════════════════════════════════════════════════════\n\n";
        
        if (!preg_match('/^(\d+)-(\d+)$/', $range, $matches)) {
            echo "  ❌ Invalid range format! Use: start-end (e.g., 1-50)\n\n";
            return;
        }
        
        $start = (int) $matches[1];
        $end = (int) $matches[2];
        
        if ($start > $end) {
            echo "  ❌ Start ID must be less than End ID!\n\n";
            return;
        }
        
        echo "  Range: $start to $end\n";
        echo "  Target: $campusName\n\n";
        
        $users = User::whereBetween('id', [$start, $end])->get();
        
        if ($users->isEmpty()) {
            echo "  ⚠️ No users found in range $start-$end!\n\n";
            return;
        }
        
        echo "  Reassigning users:\n";
        echo "  " . str_repeat('-', 55) . "\n";
        
        $reassigned = 0;
        foreach ($users as $user) {
            $user->campus_id = $targetCampusId;
            $user->save();
            
            // Also update alumni_profile if exists
            DB::table('alumni_profiles')
                ->where('user_id', $user->id)
                ->update(['campus_id' => $targetCampusId]);
            
            echo sprintf("  ✅ ID: %-5d %-30s → %s\n", 
                $user->id, 
                substr($user->name, 0, 28),
                $campusName
            );
            $reassigned++;
        }
        
        echo "\n  ═══════════════════════════════════════════════════════════\n";
        echo "  ✅ Successfully reassigned $reassigned users to $campusName\n\n";
        
        $this->showStats();
    }
    
    private function resetAllToMain()
    {
        echo "🔄 RESET ALL USERS TO MAIN CAMPUS\n";
        echo "═══════════════════════════════════════════════════════════\n\n";
        
        $count = DB::table('users')->where('campus_id', '!=', $this->mainCampusId)->count();
        
        if ($count === 0) {
            echo "  ⚠️ All users are already in Main Campus!\n\n";
            return;
        }
        
        echo "  This will reset $count users back to Main Campus.\n";
        echo "  Are you sure? (This action cannot be undone)\n\n";
        echo "  Type 'yes' to confirm: ";
        
        $handle = fopen("php://stdin", "r");
        $confirm = trim(fgets($handle));
        fclose($handle);
        
        if (strtolower($confirm) !== 'yes') {
            echo "\n  ❌ Operation cancelled.\n\n";
            return;
        }
        
        echo "\n  Resetting...\n";
        
        // Reset users
        DB::table('users')->update(['campus_id' => $this->mainCampusId]);
        
        // Reset alumni_profiles
        DB::table('alumni_profiles')->update(['campus_id' => $this->mainCampusId]);
        
        echo "  ✅ Successfully reset all users to Main Campus!\n\n";
        
        $this->showStats();
    }
    
    private function getArgValue($args, $key)
    {
        $index = array_search($key, $args);
        if ($index !== false && isset($args[$index + 1])) {
            return $args[$index + 1];
        }
        return null;
    }
    
    private function error($message)
    {
        echo "\n$message\n\n";
    }
}

// Run the script
$reassigner = new CampusReassigner();
$reassigner->run($argv);
