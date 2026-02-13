<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Share theme preference
        View::share('appearance', $request->cookie('appearance') ?? 'system');
        
        // Share full appearance settings for logos and favicon
        try {
            $appearanceSettings = DB::table('system_appearance_settings')->first();
        } catch (\Exception $e) {
            $appearanceSettings = null;
        }
        View::share('appearanceSettings', $appearanceSettings);

        return $next($request);
    }
}
