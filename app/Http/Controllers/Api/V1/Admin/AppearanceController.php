<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AppearanceController extends Controller
{
    /**
     * Get system appearance settings
     */
    public function index()
    {
        $settings = DB::table('system_appearance_settings')->first();
        
        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    /**
     * Update system appearance settings
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'logo_light_path' => 'nullable|string|max:255',
            'logo_dark_path' => 'nullable|string|max:255',
            'favicon_path' => 'nullable|string|max:255',
            'background_image_path' => 'nullable|string|max:255',
            'primary_color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'secondary_color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'accent_color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'enable_dark_mode' => 'boolean',
            'default_theme' => 'in:light,dark,system',
            'font_family' => 'nullable|string|max:100',
            'custom_css' => 'nullable|string',
            'custom_js' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        
        $updated = DB::table('system_appearance_settings')
            ->where('id', 1)
            ->update($data);

        $settings = DB::table('system_appearance_settings')->first();

        return response()->json([
            'success' => true,
            'message' => 'Appearance settings updated successfully',
            'data' => $settings
        ]);
    }

    /**
     * Upload appearance image (logo, favicon, background)
     */
    public function uploadImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|image|mimes:jpeg,png,jpg,svg,ico|max:10240', // 10MB max
            'type' => 'required|in:logo_light,logo_dark,favicon,background'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $file = $request->file('file');
        $type = $request->input('type');
        
        // Generate unique filename
        $filename = time() . '_' . $type . '.' . $file->getClientOriginalExtension();
        
        // Store in public storage
        $path = $file->storeAs('appearance', $filename, 'public');
        
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
     * Delete appearance image
     */
    public function deleteImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'path' => 'required|string',
            'type' => 'required|in:logo_light,logo_dark,favicon,background'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $path = $request->input('path');
        $type = $request->input('type');

        // Delete file from storage
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        // Update database to remove path
        $column = $type . '_path';
        DB::table('system_appearance_settings')
            ->where('id', 1)
            ->update([$column => null]);

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully'
        ]);
    }
}
