<?php

namespace App\Services;

use App\Models\Campus;
use App\Models\User;
use App\Models\AlumniProfile;
use App\Models\Batch;
use App\Models\Course;
use App\Models\Department;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CampusService
{
    /**
     * Cache duration in seconds (1 hour)
     */
    const CACHE_TTL = 3600;

    /**
     * Get all active campuses (cached).
     */
    public function getAllCampuses(): Collection
    {
        return Cache::remember('campuses.all', self::CACHE_TTL, function () {
            return Campus::active()->orderBy('name')->get();
        });
    }

    /**
     * Get all campuses as options for dropdowns.
     */
    public function getCampusOptions(): array
    {
        return Cache::remember('campuses.options', self::CACHE_TTL, function () {
            return Campus::getOptions();
        });
    }

    /**
     * Get campus by ID.
     */
    public function getCampusById(int $id): ?Campus
    {
        return Cache::remember("campus.{$id}", self::CACHE_TTL, function () use ($id) {
            return Campus::find($id);
        });
    }

    /**
     * Get campus by code.
     */
    public function getCampusByCode(string $code): ?Campus
    {
        return Cache::remember("campus.code.{$code}", self::CACHE_TTL, function () use ($code) {
            return Campus::byCode($code)->active()->first();
        });
    }

    /**
     * Get the main campus.
     */
    public function getMainCampus(): ?Campus
    {
        return $this->getCampusByCode(Campus::CODE_MAIN);
    }

    /**
     * Get the Cavite campus.
     */
    public function getCaviteCampus(): ?Campus
    {
        return $this->getCampusByCode(Campus::CODE_CAVITE);
    }

    /**
     * Get statistics for a specific campus.
     */
    public function getCampusStatistics(Campus|int $campus): array
    {
        $campusId = $campus instanceof Campus ? $campus->id : $campus;

        return Cache::remember("campus.{$campusId}.stats", 300, function () use ($campusId) {
            $totalAlumni = AlumniProfile::where('campus_id', $campusId)->count();
            $employedCount = AlumniProfile::where('campus_id', $campusId)
                ->whereIn('employment_status', ['employed_full_time', 'employed_part_time', 'self_employed'])
                ->count();
            $employmentRate = $totalAlumni > 0 ? round(($employedCount / $totalAlumni) * 100, 1) : 0;

            return [
                'total_users' => User::where('campus_id', $campusId)->count(),
                'total_alumni' => $totalAlumni,
                'total_batches' => Batch::where('campus_id', $campusId)->count(),
                'total_courses' => Course::where('campus_id', $campusId)->count(),
                'total_departments' => Department::where('campus_id', $campusId)->count(),
                'employed_count' => $employedCount,
                'employment_rate' => $employmentRate,
                'active_surveys' => 0, // Placeholder - can be updated when survey filtering is needed
                'response_rate' => 0, // Placeholder
            ];
        });
    }

    /**
     * Get comparison statistics between campuses.
     */
    public function getCampusComparison(): array
    {
        return Cache::remember('campuses.comparison', 300, function () {
            $campuses = $this->getAllCampuses();
            $comparison = [];

            foreach ($campuses as $campus) {
                $stats = $this->getCampusStatistics($campus);

                $comparison[] = [
                    'campus_id' => $campus->id,
                    'campus_name' => $campus->display_name,
                    'campus_code' => $campus->code,
                    'total_alumni' => $stats['total_alumni'],
                    'employed_count' => $stats['employed_count'],
                    'employment_rate' => $stats['employment_rate'],
                ];
            }

            return $comparison;
        });
    }

    /**
     * Get employment breakdown by campus.
     */
    public function getEmploymentBreakdownByCampus(): array
    {
        return Cache::remember('campuses.employment_breakdown', 300, function () {
            return DB::table('alumni_profiles')
                ->join('campuses', 'alumni_profiles.campus_id', '=', 'campuses.id')
                ->select(
                    'campuses.id as campus_id',
                    'campuses.code as campus_code',
                    'campuses.display_name as campus_name',
                    'alumni_profiles.employment_status',
                    DB::raw('COUNT(*) as count')
                )
                ->groupBy('campuses.id', 'campuses.code', 'campuses.display_name', 'alumni_profiles.employment_status')
                ->get()
                ->groupBy('campus_code')
                ->map(function ($items) {
                    return $items->pluck('count', 'employment_status')->toArray();
                })
                ->toArray();
        });
    }

    /**
     * Check if user can switch between campuses.
     * Admins and super admins can switch; regular users are locked to their campus.
     */
    public function canUserSwitchCampus(User $user): bool
    {
        // Admins and super_admins can switch campuses
        return in_array($user->role, ['admin', 'super_admin']);
    }

    /**
     * Get the effective campus ID for a user's view.
     * Admins can view any campus; others see only their own.
     */
    public function getEffectiveCampusId(User $user, ?int $requestedCampusId = null): int
    {
        // If user can switch and requested a specific campus, use that
        if ($this->canUserSwitchCampus($user) && $requestedCampusId) {
            // Verify the requested campus exists and is active
            $campus = $this->getCampusById($requestedCampusId);
            if ($campus && $campus->is_active) {
                return $requestedCampusId;
            }
        }

        // Otherwise, use user's own campus
        return $user->campus_id ?? 1;
    }

    /**
     * Clear all campus-related cache.
     */
    public function clearCache(): void
    {
        Cache::forget('campuses.all');
        Cache::forget('campuses.options');
        Cache::forget('campuses.comparison');
        Cache::forget('campuses.employment_breakdown');

        // Clear individual campus caches
        $campuses = Campus::all();
        foreach ($campuses as $campus) {
            Cache::forget("campus.{$campus->id}");
            Cache::forget("campus.{$campus->id}.stats");
            Cache::forget("campus.code.{$campus->code}");
        }
    }

    /**
     * Create a new campus.
     */
    public function createCampus(array $data): Campus
    {
        $campus = Campus::create($data);
        $this->clearCache();
        return $campus;
    }

    /**
     * Update an existing campus.
     */
    public function updateCampus(Campus $campus, array $data): Campus
    {
        $campus->update($data);
        $this->clearCache();
        return $campus;
    }

    /**
     * Deactivate a campus (soft disable).
     */
    public function deactivateCampus(Campus $campus): bool
    {
        // Prevent deactivating if there are active users
        $activeUsers = User::where('campus_id', $campus->id)
            ->where('is_active', true)
            ->count();

        if ($activeUsers > 0) {
            throw new \Exception("Cannot deactivate campus with {$activeUsers} active users.");
        }

        $campus->is_active = false;
        $campus->save();
        $this->clearCache();

        return true;
    }

    /**
     * Get campus distribution for dashboard.
     */
    public function getCampusDistribution(): array
    {
        return Cache::remember('campuses.distribution', 300, function () {
            return DB::table('users')
                ->join('campuses', 'users.campus_id', '=', 'campuses.id')
                ->where('users.role', 'alumni')
                ->select(
                    'campuses.id',
                    'campuses.code',
                    'campuses.display_name',
                    DB::raw('COUNT(*) as total_users')
                )
                ->groupBy('campuses.id', 'campuses.code', 'campuses.display_name')
                ->get()
                ->toArray();
        });
    }
}
