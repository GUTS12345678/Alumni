<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;

class CertificateController extends Controller
{
    /**
     * Get all certificates for the authenticated user
     */
    public function index()
    {
        $user = Auth::user();
        
        $certificates = Certificate::where('user_id', $user->id)
            ->orderBy('issued_date', 'desc')
            ->get()
            ->map(function ($cert) {
                return [
                    'id' => $cert->id,
                    'type' => $cert->type,
                    'title' => $cert->title,
                    'description' => $cert->description,
                    'issued_date' => $cert->issued_date->toISOString(),
                    'certificate_number' => $cert->certificate_number,
                    'status' => $cert->status,
                    'download_url' => "/api/v1/certificates/{$cert->id}/download",
                    'metadata' => $cert->metadata,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $certificates,
        ]);
    }

    /**
     * Get a specific certificate
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $certificate = Certificate::where('user_id', $user->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $certificate->id,
                'type' => $certificate->type,
                'title' => $certificate->title,
                'description' => $certificate->description,
                'issued_date' => $certificate->issued_date->toISOString(),
                'certificate_number' => $certificate->certificate_number,
                'status' => $certificate->status,
                'download_url' => "/api/v1/certificates/{$certificate->id}/download",
                'metadata' => $certificate->metadata,
            ],
        ]);
    }

    /**
     * Download certificate as PDF or HTML
     */
    public function download($id)
    {
        $user = Auth::user();
        
        $certificate = Certificate::where('user_id', $user->id)
            ->where('status', 'available')
            ->findOrFail($id);

        // Get alumni profile for the certificate
        $alumniProfile = $user->alumniProfile;

        $data = [
            'certificate' => $certificate,
            'user' => $user,
            'alumniProfile' => $alumniProfile,
            'institutionName' => config('app.name', 'Alumni Tracer System'),
            'issuedDate' => $certificate->issued_date->format('F d, Y'),
        ];

        // Check if DomPDF is available
        if (class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('certificates.template', $data);
            $pdf->setPaper('a4', 'landscape');
            $filename = "certificate-{$certificate->certificate_number}.pdf";
            return $pdf->download($filename);
        }

        // Fallback: Return HTML certificate that can be printed
        $html = View::make('certificates.template', $data)->render();
        
        return response($html, 200)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', 'attachment; filename="certificate-' . $certificate->certificate_number . '.html"');
    }

    /**
     * Request a membership certificate
     */
    public function requestMembershipCertificate()
    {
        $user = Auth::user();

        // Check if user already has a membership certificate
        $existing = Certificate::where('user_id', $user->id)
            ->where('type', Certificate::TYPE_MEMBERSHIP)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a membership certificate',
                'data' => [
                    'id' => $existing->id,
                    'certificate_number' => $existing->certificate_number,
                ],
            ], 400);
        }

        // Create membership certificate
        $certificate = Certificate::createMembershipCertificate($user);

        return response()->json([
            'success' => true,
            'message' => 'Membership certificate created successfully',
            'data' => [
                'id' => $certificate->id,
                'type' => $certificate->type,
                'title' => $certificate->title,
                'description' => $certificate->description,
                'issued_date' => $certificate->issued_date->toISOString(),
                'certificate_number' => $certificate->certificate_number,
                'status' => $certificate->status,
                'download_url' => "/api/v1/certificates/{$certificate->id}/download",
            ],
        ]);
    }

    /**
     * Get certificate statistics for the user
     */
    public function stats()
    {
        $user = Auth::user();
        
        $stats = [
            'total' => Certificate::where('user_id', $user->id)->count(),
            'available' => Certificate::where('user_id', $user->id)->where('status', 'available')->count(),
            'pending' => Certificate::where('user_id', $user->id)->where('status', 'pending')->count(),
            'by_type' => Certificate::where('user_id', $user->id)
                ->selectRaw('type, count(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}
