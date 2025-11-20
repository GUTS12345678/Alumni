<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Get authenticated user's profile
     */
    public function show()
    {
        $user = Auth::user();
        
        // Parse social_links JSON if it exists
        if ($user->social_links) {
            $user->social_links = json_decode($user->social_links, true);
        }

        // Add full URLs for profile and cover photo
        $user->profile_picture_url = $user->profile_picture_path ? Storage::url($user->profile_picture_path) : null;
        $user->cover_photo_url = $user->cover_photo_path ? Storage::url($user->cover_photo_path) : null;

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * Update authenticated user's profile
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'phone_number' => 'nullable|string|max:20',
            'bio' => 'nullable|string|max:1000',
            'location' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'social_links' => 'nullable|array',
            'social_links.linkedin' => 'nullable|url|max:255',
            'social_links.facebook' => 'nullable|url|max:255',
            'social_links.twitter' => 'nullable|url|max:255',
            'social_links.instagram' => 'nullable|url|max:255',
            'social_links.github' => 'nullable|url|max:255',
            'preferred_theme' => 'nullable|in:light,dark,system',
            'preferred_language' => 'nullable|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        
        // Convert social_links array to JSON
        if (isset($data['social_links'])) {
            $data['social_links'] = json_encode($data['social_links']);
        }

        $user->update($data);

        // Parse social_links back to array for response
        $user->refresh();
        if ($user->social_links) {
            $user->social_links = json_decode($user->social_links, true);
        }

        // Add full URLs for profile and cover photo
        $user->profile_picture_url = $user->profile_picture_path ? Storage::url($user->profile_picture_path) : null;
        $user->cover_photo_url = $user->cover_photo_path ? Storage::url($user->cover_photo_path) : null;

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $user
        ]);
    }

    /**
     * Upload profile or cover photo
     */
    public function uploadImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|image|mimes:jpeg,png,jpg|max:10240', // 10MB max
            'type' => 'required|in:profile_picture,cover_photo'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $file = $request->file('file');
        $type = $request->input('type');
        
        // Delete old image if exists
        $column = $type . '_path';
        if ($user->$column) {
            if (Storage::disk('public')->exists($user->$column)) {
                Storage::disk('public')->delete($user->$column);
            }
        }
        
        // Generate unique filename
        $filename = $user->id . '_' . $type . '_' . time() . '.' . $file->getClientOriginalExtension();
        
        // Store in public storage
        $path = $file->storeAs('profile_images', $filename, 'public');
        
        // Update user record
        $user->update([$column => $path]);
        
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
     * Delete profile or cover photo
     */
    public function deleteImage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:profile_picture,cover_photo'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        $type = $request->input('type');
        $column = $type . '_path';

        // Delete file from storage
        if ($user->$column) {
            if (Storage::disk('public')->exists($user->$column)) {
                Storage::disk('public')->delete($user->$column);
            }
            
            // Update database to remove path
            $user->update([$column => null]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully'
        ]);
    }

    /**
     * Update password
     */
    public function updatePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => ['required', 'confirmed', Password::defaults()],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 422);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully'
        ]);
    }
}
