<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ProcessTemplate;
use App\Models\User;

$data = [
    'templates' => ProcessTemplate::all(['id', 'name'])->toArray(),
    'stations' => User::where('is_station', true)->get(['id', 'name', 'division'])->toArray(),
    'users_all' => User::all(['id', 'name', 'role', 'division'])->toArray(),
];

file_put_contents('debug_data.json', json_encode($data, JSON_PRETTY_PRINT));
echo "Done\n";
