<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubProcess;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SubProcessController extends Controller
{
    /**
     * Display a listing of sub-processes.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SubProcess::with('parentProcessTemplate');

        // Filter by parent process (SEWING, FINISHING, etc.)
        if ($request->has('parent_process_template_id')) {
            $query->where('parent_process_template_id', $request->parent_process_template_id);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $subProcesses = $query->orderBy('parent_process_template_id')
                              ->orderBy('name')
                              ->get();

        return response()->json([
            'success' => true,
            'data' => $subProcesses
        ]);
    }

    /**
     * Store a newly created sub-process.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'parent_process_template_id' => 'required|exists:process_templates,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $subProcess = SubProcess::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Sub-process created successfully',
            'data' => $subProcess->load('parentProcessTemplate')
        ], 201);
    }

    /**
     * Display the specified sub-process.
     */
    public function show(SubProcess $subProcess): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $subProcess->load('parentProcessTemplate')
        ]);
    }

    /**
     * Update the specified sub-process.
     */
    public function update(Request $request, SubProcess $subProcess): JsonResponse
    {
        $validated = $request->validate([
            'parent_process_template_id' => 'sometimes|exists:process_templates,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $subProcess->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Sub-process updated successfully',
            'data' => $subProcess->fresh()->load('parentProcessTemplate')
        ]);
    }

    /**
     * Remove the specified sub-process.
     */
    public function destroy(SubProcess $subProcess): JsonResponse
    {
        $subProcess->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sub-process deleted successfully'
        ]);
    }
}
