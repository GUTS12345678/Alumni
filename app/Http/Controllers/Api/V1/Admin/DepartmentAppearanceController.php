<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class DepartmentAppearanceController extends Controller
{
    /**
     * Get department appearance settings
     */
    public function show($departmentId)
    {
        $department = DB::table('departments')
            ->where('id', $departmentId)
            ->first();

        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $department->id,
                'name' => $department->name,
                'logo_path' => $department->logo_path,
                'background_image_path' => $department->background_image_path,
                'primary_color' => $department->primary_color,
                'secondary_color' => $department->secondary_color,
                'custom_css' => $department->custom_css,
            ]
        ]);
    }

    /**
     * Update department appearance settings
     */
    public function update(Request $request, $departmentId)
    {
        $validator = Validator::make($request->all(), [
            'logo_path' => 'nullable|string|max:255',
            'background_image_path' => 'nullable|string|max:255',
            'primary_color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'secondary_color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'custom_css' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $department = DB::table('departments')->where('id', $departmentId)->first();
        
        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }

        $data = $validator->validated();
        
        DB::table('departments')
            ->where('id', $departmentId)
            ->update($data);

        $updated = DB::table('departments')->where('id', $departmentId)->first();

        return response()->json([
            'success' => true,
            'message' => 'Department appearance updated successfully',
            'data' => $updated
        ]);
    }

    /**
     * Upload department image (logo or background)
     */
    public function uploadImage(Request $request, $departmentId)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|image|mimes:jpeg,png,jpg,svg|max:10240', // 10MB max
            'type' => 'required|in:logo,background'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $department = DB::table('departments')->where('id', $departmentId)->first();
        
        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }

        $file = $request->file('file');
        $type = $request->input('type');
        
        // Generate unique filename
        $filename = 'dept_' . $departmentId . '_' . $type . '_' . time() . '.' . $file->getClientOriginalExtension();
        
        // Store in public storage
        $path = $file->storeAs('departments', $filename, 'public');
        
        // Get full URL
        $url = Storage::url($path);

        return response()->json([
            'success' => true,
            'message' => 'Image uploaded successfully',
            'data' => [
                'path' => $path,
                'url' => $url
            ]
        ]);
    }

    /**
     * Delete department image
     */
    public function deleteImage(Request $request, $departmentId)
    {
        $validator = Validator::make($request->all(), [
            'path' => 'required|string',
            'type' => 'required|in:logo,background'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $department = DB::table('departments')->where('id', $departmentId)->first();
        
        if (!$department) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        }

        $path = $request->input('path');
        $type = $request->input('type');

        // Delete file from storage
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        // Update database to remove path
        $column = $type === 'logo' ? 'logo_path' : 'background_image_path';
        DB::table('departments')
            ->where('id', $departmentId)
            ->update([$column => null]);

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully'
        ]);
    }
}
