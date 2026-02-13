<?php

namespace App\Http\Controllers\Alumni;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class SupportController extends Controller
{
    /**
     * Display user's support tickets
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $tickets = SupportTicket::where('user_id', $user->id)
            ->with(['replies' => function ($q) {
                $q->latest()->limit(1);
            }])
            ->orderBy('updated_at', 'desc')
            ->paginate(10);

        return Inertia::render('Alumni/Support/Index', [
            'tickets' => $tickets,
        ]);
    }

    /**
     * Show ticket details
     */
    public function show(Request $request, $ticketNumber)
    {
        $user = $request->user();
        
        $ticket = SupportTicket::where('ticket_number', $ticketNumber)
            ->where('user_id', $user->id)
            ->with(['replies.user', 'assignedAdmin'])
            ->firstOrFail();

        return Inertia::render('Alumni/Support/Show', [
            'ticket' => $ticket,
        ]);
    }

    /**
     * Create a new support ticket
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'category' => 'required|in:general,technical,account,employment,alumni_association,other',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $user = $request->user();

        // Set priority based on category
        $priority = match($request->category) {
            'technical' => 'high',
            'account' => 'high',
            'alumni_association' => 'medium',
            default => 'medium',
        };

        $ticket = SupportTicket::create([
            'user_id' => $user->id,
            'category' => $request->category,
            'subject' => $request->subject,
            'message' => $request->message,
            'priority' => $priority,
        ]);

        ActivityLog::logActivity(
            $user->id,
            'support_ticket_created',
            "Created support ticket: {$ticket->ticket_number} - {$ticket->subject}",
            'SupportTicket',
            $ticket->id
        );

        return redirect()->back()->with('success', "Support ticket #{$ticket->ticket_number} created successfully. We'll get back to you soon!");
    }

    /**
     * Add reply to ticket
     */
    public function reply(Request $request, $ticketNumber)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $user = $request->user();
        
        $ticket = SupportTicket::where('ticket_number', $ticketNumber)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Can't reply to closed tickets
        if ($ticket->status === 'closed') {
            return redirect()->back()->with('error', 'This ticket is closed. Please create a new ticket.');
        }

        SupportTicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'message' => $request->message,
            'is_admin_reply' => false,
        ]);

        // Reopen ticket if it was resolved
        if ($ticket->status === 'resolved') {
            $ticket->update(['status' => 'open', 'resolved_at' => null]);
        }

        $ticket->touch(); // Update timestamp

        return redirect()->back()->with('success', 'Reply added successfully.');
    }

    /**
     * Close ticket (by user)
     */
    public function close(Request $request, $ticketNumber)
    {
        $user = $request->user();
        
        $ticket = SupportTicket::where('ticket_number', $ticketNumber)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $ticket->update([
            'status' => 'closed',
            'resolved_at' => now(),
        ]);

        ActivityLog::logActivity(
            $user->id,
            'support_ticket_closed',
            "Closed support ticket: {$ticket->ticket_number}",
            'SupportTicket',
            $ticket->id
        );

        return redirect()->back()->with('success', 'Ticket closed successfully.');
    }
}
