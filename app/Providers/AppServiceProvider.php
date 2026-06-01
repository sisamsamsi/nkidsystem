<?php

namespace App\Providers;

use App\Events\TaskProgressUpdated;
use App\Listeners\RecalculateOrderProgress;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register Event-Listener mappings
        Event::listen(
            TaskProgressUpdated::class,
            RecalculateOrderProgress::class
        );

        // Register Gates
        \Illuminate\Support\Facades\Gate::define('admin-only', function ($user) {
            return $user->role === 'admin';
        });

        \Illuminate\Support\Facades\Gate::define('qc-or-admin', function ($user) {
            return in_array($user->role, ['admin', 'qc']);
        });
    }
}
