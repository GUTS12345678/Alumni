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
                              ->orWhere('current_employer', 'like', "%{$search}%")
                              ->orWhere('current_job_title', 'like', "%{$search}%")
                              ->orWhere('degree_program', 'like', "%{$search}%");
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

        // Get connection statuses for all alumni in batch (avoids N+1)
        $alumniIds = $alumni->getCollection()->pluck('id')->toArray();
        $connections = AlumniConnection::where(function($q) use ($currentUser, $alumniIds) {
            $q->where('sender_id', $currentUser->id)
              ->whereIn('receiver_id', $alumniIds);
        })->orWhere(function($q) use ($currentUser, $alumniIds) {
            $q->whereIn('sender_id', $alumniIds)
              ->where('receiver_id', $currentUser->id);
        })->get();

        // Build a lookup map by alumni ID
        $connectionMap = [];
        foreach ($connections as $conn) {
            $otherUserId = $conn->sender_id == $currentUser->id ? $conn->receiver_id : $conn->sender_id;
            $status = $conn->status;
            if ($status === 'pending') {
                $status = $conn->sender_id == $currentUser->id ? 'pending' : 'received';
            }
            $connectionMap[$otherUserId] = ['status' => $status, 'connection_id' => $conn->id];
        }

        $alumni->getCollection()->transform(function($user) use ($connectionMap) {
            $info = $connectionMap[$user->id] ?? ['status' => null, 'connection_id' => null];
            $user->connection_status = $info['status'];
            $user->connection_id = $info['connection_id'];
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

        $connectionsQuery = AlumniConnection::with(['sender.alumniProfile', 'receiver.alumniProfile'])
            ->where(function($query) use ($user) {
                $query->where('sender_id', $user->id)
                      ->orWhere('receiver_id', $user->id);
            })
            ->accepted()
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        // Transform to get the connected user (not the current user)
        $connections = $connectionsQuery->through(function($connection) use ($user) {
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
        $request->validate([
            'receiver_id' => 'required|integer|exists:users,id',
        ]);

        $user = $request->user();
        $receiverId = $request->receiver_id;

        // Prevent self-connection
        if ($receiverId == $user->id) {
            return redirect()->back()->with('error', 'You cannot connect with yourself.');
        }

        // Check if receiver is an active alumni
        $receiver = User::where('id', $receiverId)->where('role', 'alumni')->where('status', 'active')->first();
        if (!$receiver) {
            return redirect()->back()->with('error', 'User not found or not available for connection.');
        }

        // Check if already connected or request exists
        $existing = AlumniConnection::where(function($query) use ($user, $receiverId) {
            $query->where('sender_id', $user->id)->where('receiver_id', $receiverId);
        })->orWhere(function($query) use ($user, $receiverId) {
            $query->where('sender_id', $receiverId)->where('receiver_id', $user->id);
        })->first();

        if ($existing) {
            // Allow re-sending if previously rejected — delete the old record
            if ($existing->status === 'rejected') {
                $existing->delete();
            } else {
                return redirect()->back()->with('error', 'Connection request already exists!');
            }
        }

        $connection = AlumniConnection::create([
            'sender_id' => $user->id,
            'receiver_id' => $receiverId,
            'status' => 'pending',
            'message' => $request->message,
        ]);

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

    /**
     * Get connected alumni for messaging
     * Returns alumni who have accepted connection requests
     */
    public function getConnectedAlumni(Request $request)
    {
        $user = $request->user();

        $connections = AlumniConnection::with(['sender.alumniProfile', 'receiver.alumniProfile'])
            ->where(function($query) use ($user) {
                $query->where('sender_id', $user->id)
                      ->orWhere('receiver_id', $user->id);
            })
            ->accepted()
            ->get();

        // Transform to get connected users with their profiles
        $connectedAlumni = $connections->map(function($connection) use ($user) {
            $connectedUser = $connection->sender_id === $user->id 
                ? $connection->receiver 
                : $connection->sender;
            
            $profile = $connectedUser->alumniProfile;
            
            return [
                'id' => $connectedUser->id,
                'name' => $profile ? "{$profile->first_name} {$profile->last_name}" : $connectedUser->name,
                'email' => $connectedUser->email,
                'profile_picture' => $connectedUser->profile_picture_path,
                'current_job_title' => $profile?->current_job_title,
                'current_employer' => $profile?->current_employer,
                'graduation_year' => $profile?->graduation_year,
                'connection_id' => $connection->id,
                'connected_since' => $connection->updated_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $connectedAlumni,
        ]);
    }

    /**
     * View another alumni's profile
     */
    public function viewProfile(Request $request, $id)
    {
        $currentUser = $request->user();
        
        $user = User::with('alumniProfile.batch')
            ->where('id', $id)
            ->where('role', 'alumni')
            ->where('status', 'active')
            ->firstOrFail();

        $connectionStatus = AlumniConnection::getConnectionStatus($currentUser->id, $user->id);
        
        // Get connection record if exists
        $connection = AlumniConnection::where(function($q) use ($currentUser, $id) {
            $q->where('sender_id', $currentUser->id)->where('receiver_id', $id);
        })->orWhere(function($q) use ($currentUser, $id) {
            $q->where('sender_id', $id)->where('receiver_id', $currentUser->id);
        })->first();

        // Count mutual connections
        $currentUserConnections = AlumniConnection::where(function($q) use ($currentUser) {
            $q->where('sender_id', $currentUser->id)->orWhere('receiver_id', $currentUser->id);
        })->accepted()->get()->map(function($c) use ($currentUser) {
            return $c->sender_id === $currentUser->id ? $c->receiver_id : $c->sender_id;
        });

        $targetUserConnections = AlumniConnection::where(function($q) use ($id) {
            $q->where('sender_id', $id)->orWhere('receiver_id', $id);
        })->accepted()->get()->map(function($c) use ($id) {
            return $c->sender_id == $id ? $c->receiver_id : $c->sender_id;
        });

        $mutualCount = $currentUserConnections->intersect($targetUserConnections)->count();
        $totalConnections = $targetUserConnections->count();

        return Inertia::render('Alumni/Network/AlumniProfileView', [
            'alumniUser' => $user,
            'profile' => $user->alumniProfile,
            'connectionStatus' => $connectionStatus,
            'connectionId' => $connection?->id,
            'mutualConnections' => $mutualCount,
            'totalConnections' => $totalConnections,
        ]);
    }

    /**
     * Get pending connection requests count
     */
    public function getPendingRequestsCount(Request $request)
    {
        $user = $request->user();

        $receivedCount = AlumniConnection::where('receiver_id', $user->id)
            ->pending()
            ->count();

        $sentCount = AlumniConnection::where('sender_id', $user->id)
            ->pending()
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'received' => $receivedCount,
                'sent' => $sentCount,
                'total' => $receivedCount + $sentCount,
            ],
        ]);
    }
}
