<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProcessTemplate;
use Illuminate\Http\Request;

class ProcessTemplateController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => ProcessTemplate::all()
        ]);
    }
}
