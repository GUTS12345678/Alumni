<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Services\CampusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CampusController extends Controller
{
    protected CampusService $campusService;

    public function __construct(CampusService $campusService)
    {
        $this->campusService = $campusService;
    }

    /**
     * Get all active campuses.
     */
    public function index(): JsonResponse
    {
        $campuses = $this->campusService->getAllCampuses();

        return response()->json([
            'success' => true,
            'data' => $campuses,
        ]);
    }

    /**
     * Get campus options for dropdowns.
     */
    public function options(): JsonResponse
    {
        $options = $this->campusService->getCampusOptions();

        return response()->json([
            'success' => true,
            'data' => $options,
        ]);
    }

    /**
     * Get a specific campus.
     */
    public function show(Campus $campus): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $campus,
        ]);
    }

    /**
     * Get campus statistics.
     */
    public function statistics(Campus $campus): JsonResponse
    {
        $stats = $this->campusService->getCampusStatistics($campus);

        return response()->json([
            'success' => true,
            'data' => [
                'campus' => $campus,
                'statistics' => $stats,
            ],
        ]);
    }

    /**
     * Get comparison between all campuses.
     */
    public function comparison(): JsonResponse
    {
        $comparison = $this->campusService->getCampusComparison();

        return response()->json([
            'success' => true,
            'data' => $comparison,
        ]);
    }

    /**
     * Get employment breakdown by campus.
     */
    public function employmentBreakdown(): JsonResponse
    {
        $breakdown = $this->campusService->getEmploymentBreakdownByCampus();

        return response()->json([
            'success' => true,
            'data' => $breakdown,
        ]);
    }

    /**
     * Get campus distribution for dashboard.
     */
    public function distribution(): JsonResponse
    {
        $distribution = $this->campusService->getCampusDistribution();

        return response()->json([
            'success' => true,
            'data' => $distribution,
        ]);
    }

    /**
     * Check if current user can switch campuses.
     */
    public function canSwitch(): JsonResponse
    {
        $user = auth()->user();
        $canSwitch = $this->campusService->canUserSwitchCampus($user);

        return response()->json([
            'success' => true,
            'data' => [
                'can_switch' => $canSwitch,
                'current_campus_id' => $user->campus_id,
                'current_campus' => $user->campus,
            ],
        ]);
    }

    /**
     * Get effective campus for current view.
     */
    public function effective(Request $request): JsonResponse
    {
        $user = auth()->user();
        $requestedCampusId = $request->input('campus_id');
        
        $effectiveCampusId = $this->campusService->getEffectiveCampusId($user, $requestedCampusId);
        $campus = $this->campusService->getCampusById($effectiveCampusId);

        return response()->json([
            'success' => true,
            'data' => [
                'effective_campus_id' => $effectiveCampusId,
                'campus' => $campus,
                'can_switch' => $this->campusService->canUserSwitchCampus($user),
            ],
        ]);
    }

    /**
     * Create a new campus (admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('manage-campuses');

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:10|unique:campuses,code',
            'display_name' => 'required|string|max:150',
            'address' => 'nullable|string',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        $campus = $this->campusService->createCampus($validated);

        return response()->json([
            'success' => true,
            'message' => 'Campus created successfully.',
            'data' => $campus,
        ], 201);
    }

    /**
     * Update an existing campus (admin only).
     */
    public function update(Request $request, Campus $campus): JsonResponse
    {
        $this->authorize('manage-campuses');

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'code' => ['sometimes', 'string', 'max:10', Rule::unique('campuses')->ignore($campus->id)],
            'display_name' => 'sometimes|string|max:150',
            'address' => 'nullable|string',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        $campus = $this->campusService->updateCampus($campus, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Campus updated successfully.',
            'data' => $campus,
        ]);
    }

    /**
     * Deactivate a campus (admin only).
     */
    public function deactivate(Campus $campus): JsonResponse
    {
        $this->authorize('manage-campuses');

        try {
            $this->campusService->deactivateCampus($campus);

            return response()->json([
                'success' => true,
                'message' => 'Campus deactivated successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Clear campus cache (admin only).
     */
    public function clearCache(): JsonResponse
    {
        $this->authorize('manage-campuses');

        $this->campusService->clearCache();

        return response()->json([
            'success' => true,
            'message' => 'Campus cache cleared successfully.',
        ]);
    }
}
