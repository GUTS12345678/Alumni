<?php

namespace App\Http\Controllers\Alumni;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AlumniConnection;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NetworkController extends Controller
{
    /**
     * Display alumni directory
     */
    public function index(Request $request)
    {
        $currentUser = $request->user();
        
        $query = User::with('alumniProfile')
            ->where('role', 'alumni')
            ->where('status', 'active')
            ->where('id', '!=', $currentUser->id);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhereHas('alumniProfile', function($profile) use ($search) {
                      $profile->where('first_name', 'like', "%{$search}%")
                              ->orWhere('last_name', 'like', "%{$search}%")
                              ->orWhere('current_company', 'like', "%{$search}%")
                              ->orWhere('current_position', 'like', "%{$search}%");
                  });
            });
        }

        // Batch filter
        if ($request->filled('batch')) {
            $query->whereHas('alumniProfile', function($profile) use ($request) {
                $profile->where('batch_id', $request->batch);
            });
        }

        $alumni = $query->paginate(12);

        // Get connection statuses for each alumni
        $alumni->getCollection()->transform(function($user) use ($currentUser) {
            $user->connection_status = AlumniConnection::getConnectionStatus($currentUser->id, $user->id);
            return $user;
        });

        return Inertia::render('Alumni/Network/AlumniDirectory', [
            'alumni' => $alumni,
            'filters' => $request->only(['search', 'batch']),
        ]);
    }

    /**
     * Get my connections
     */
    public function connections(Request $request)
    {
        $user = $request->user();

        $connections = AlumniConnection::with(['sender.alumniProfile', 'receiver.alumniProfile'])
            ->where(function($query) use ($user) {
                $query->where('sender_id', $user->id)
                      ->orWhere('receiver_id', $user->id);
            })
            ->accepted()
            ->orderBy('created_at', 'desc')
            ->get();

        // Transform to get the connected user (not the current user)
        $connections = $connections->map(function($connection) use ($user) {
            $connectedUser = $connection->sender_id === $user->id 
                ? $connection->receiver 
                : $connection->sender;
            
            return [
                'connection_id' => $connection->id,
                'user' => $connectedUser,
                'connected_since' => $connection->created_at,
            ];
        });

        return Inertia::render('Alumni/Network/MyConnections', [
            'connections' => $connections,
        ]);
    }

    /**
     * Get connection requests (pending)
     */
    public function requests(Request $request)
    {
        $user = $request->user();

        $sentRequests = AlumniConnection::with('receiver.alumniProfile')
            ->where('sender_id', $user->id)
            ->pending()
            ->orderBy('created_at', 'desc')
            ->get();

        $receivedRequests = AlumniConnection::with('sender.alumniProfile')
            ->where('receiver_id', $user->id)
            ->pending()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'sent' => $sentRequests,
            'received' => $receivedRequests,
        ]);
    }

    /**
     * Send connection request
     */
    public function sendRequest(Request $request)
    {
        $user = $request->user();
        $receiverId = $request->receiver_id;

        // Check if already connected or request exists
        $existing = AlumniConnection::where(function($query) use ($user, $receiverId) {
            $query->where('sender_id', $user->id)->where('receiver_id', $receiverId);
        })->orWhere(function($query) use ($user, $receiverId) {
            $query->where('sender_id', $receiverId)->where('receiver_id', $user->id);
        })->first();

        if ($existing) {
            return redirect()->back()->with('error', 'Connection request already exists!');
        }

        $connection = AlumniConnection::create([
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'status' => 'pending',
            'message' => $request->message,
        ]);

        $receiver = User::find($receiverId);
        ActivityLog::logActivity(
            $user->id,
            'connection_sent',
            "Sent connection request to {$receiver->name}",
            'AlumniConnection',
            $connection->id
        );

        return redirect()->back()->with('success', 'Connection request sent!');
    }

    /**
     * Accept connection request
     */
    public function acceptRequest(Request $request, $id)
    {
        $user = $request->user();
        
        $connection = AlumniConnection::where('id', $id)
            ->where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $connection->update([
            'status' => 'accepted',
            'responded_at' => now(),
        ]);

        ActivityLog::logActivity(
            $user->id,
            'connection_accepted',
            "Accepted connection from {$connection->sender->name}",
            'AlumniConnection',
            $connection->id
        );

        return redirect()->back()->with('success', 'Connection accepted!');
    }

    /**
     * Reject connection request
     */
    public function rejectRequest(Request $request, $id)
    {
        $user = $request->user();
        
        $connection = AlumniConnection::where('id', $id)
            ->where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->firstOrFail();

        $connection->update([
            'status' => 'rejected',
            'responded_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Connection rejected!');
    }

    /**
     * Remove connection
     */
    public function removeConnection(Request $request, $id)
    {
        $user = $request->user();
        
        $connection = AlumniConnection::where('id', $id)
            ->where(function($query) use ($user) {
                $query->where('sender_id', $user->id)
                      ->orWhere('receiver_id', $user->id);
            })
            ->firstOrFail();

        $connection->delete();

        return redirect()->back()->with('success', 'Connection removed!');
    }
}
