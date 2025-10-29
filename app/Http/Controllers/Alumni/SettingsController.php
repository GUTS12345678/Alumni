<?php

namespace App\Http\Controllers\Alumni;

use App\Http\Controllers\Controller;
use App\Models\UserSettings;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Display the settings page
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get or create user settings
        $settings = UserSettings::firstOrCreate(
            ['user_id' => $user->id],
            [
                'email_notifications' => true,
                'survey_reminders' => true,
                'network_updates' => true,
                'profile_visibility' => true,
                'show_employment_status' => true,
                'allow_connection_requests' => true,
            ]
        );

        return Inertia::render('Alumni/Settings', [
            'settings' => $settings,
            'user' => [
                'email' => $user->email,
                'role' => $user->role,
            ]
        ]);
    }

    /**
     * Update password
     */
    public function updatePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $user = $request->user();

        // Check if current password is correct
        if (!Hash::check($request->current_password, $user->password)) {
            return redirect()->back()
                ->withErrors(['current_password' => 'Current password is incorrect'])
                ->withInput();
        }

        // Update password
        $user->password = Hash::make($request->new_password);
        $user->save();

        // Log activity
        ActivityLog::logActivity(
            $user->id,
            'password_changed',
            'User changed their password',
            'User',
            $user->id
        );

        return redirect()->back()->with('success', 'Password updated successfully!');
    }

    /**
     * Update notification settings
     */
    public function updateNotifications(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email_notifications' => 'required|boolean',
            'survey_reminders' => 'required|boolean',
            'network_updates' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $user = $request->user();
        
        $settings = UserSettings::firstOrCreate(['user_id' => $user->id]);
        
        $settings->update([
            'email_notifications' => $request->email_notifications,
            'survey_reminders' => $request->survey_reminders,
            'network_updates' => $request->network_updates,
        ]);

        ActivityLog::logActivity(
            $user->id,
            'settings_updated',
            'User updated notification settings',
            'UserSettings',
            $settings->id
        );

        return redirect()->back()->with('success', 'Notification settings updated successfully!');
    }

    /**
     * Update privacy settings
     */
    public function updatePrivacy(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'profile_visibility' => 'required|boolean',
            'show_employment_status' => 'required|boolean',
            'allow_connection_requests' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $user = $request->user();
        
        $settings = UserSettings::firstOrCreate(['user_id' => $user->id]);
        
        $settings->update([
            'profile_visibility' => $request->profile_visibility,
            'show_employment_status' => $request->show_employment_status,
            'allow_connection_requests' => $request->allow_connection_requests,
        ]);

        ActivityLog::logActivity(
            $user->id,
            'settings_updated',
            'User updated privacy settings',
            'UserSettings',
            $settings->id
        );

        return redirect()->back()->with('success', 'Privacy settings updated successfully!');
    }
}
