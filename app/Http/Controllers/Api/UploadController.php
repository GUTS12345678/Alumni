<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    /**
     * Upload an image for announcements, job postings, or other content.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Only admins can upload images
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can upload images.',
            ], 403);
        }

        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
            'type' => 'nullable|string|in:announcement,job,general',
        ]);

        $type = $request->input('type', 'general');
        // Store directly in the type folder (e.g., 'jobs', 'announcements')
        // matching the existing structure
        $folder = $type === 'job' ? 'jobs' : ($type === 'announcement' ? 'announcements' : 'general');
        
        // Generate unique filename
        $file = $request->file('image');
        $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        
        // Store the file in private uploads disk (not publicly accessible)
        $path = $file->storeAs($folder, $filename, 'uploads');

        return response()->json([
            'success' => true,
            'path' => $path,
            'url' => private_url($path),
            'message' => 'Image uploaded successfully.',
        ]);
    }

    /**
     * Delete an uploaded image.
     */
    public function deleteImage(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators can delete images.',
            ], 403);
        }

        $request->validate([
            'path' => 'required|string',
        ]);

        $path = $request->input('path');
        
        // Ensure the path is within allowed folders (jobs, announcements, general, profile_images)
        $allowedFolders = ['jobs/', 'announcements/', 'general/', 'profile_images/', 'departments/', 'appearance/'];
        $isAllowed = false;
        foreach ($allowedFolders as $folder) {
            if (str_starts_with($path, $folder)) {
                $isAllowed = true;
                break;
            }
        }
        
        if (!$isAllowed) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid file path.',
            ], 400);
        }

        if (Storage::disk('uploads')->exists($path)) {
            Storage::disk('uploads')->delete($path);
            
            return response()->json([
                'success' => true,
                'message' => 'Image deleted successfully.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'File not found.',
        ], 404);
    }
}
