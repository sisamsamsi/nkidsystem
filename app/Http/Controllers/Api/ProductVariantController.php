<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use Illuminate\Http\Request;

class ProductVariantController extends Controller
{
    /**
     * Display a listing of product variants
     */
    public function index(Request $request)
    {
        $query = ProductVariant::with(['product', 'processes.template']);

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        $variants = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $variants,
        ]);
    }

    /**
     * Store a newly created variant
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'name' => 'required|string|max:255',
            'colors' => 'required|string',
            'sizes' => 'required|string',
            'price' => 'nullable|numeric|min:0',
        ]);

        $variant = ProductVariant::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Variant created successfully',
            'data' => $variant,
        ], 201);
    }

    /**
     * Display the specified variant
     */
    public function show(ProductVariant $productVariant)
    {
        return response()->json([
            'success' => true,
            'data' => $productVariant->load(['product', 'processes.template', 'subProcesses.parentProcessTemplate']),
        ]);
    }

    /**
     * Update the specified variant
     */
    public function update(Request $request, ProductVariant $productVariant)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'colors' => 'sometimes|required|string',
            'sizes' => 'sometimes|required|string',
            'price' => 'nullable|numeric|min:0',
        ]);

        $productVariant->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Variant updated successfully',
            'data' => $productVariant,
        ]);
    }

    /**
     * Remove the specified variant
     */
    public function destroy(ProductVariant $productVariant)
    {
        $productVariant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Variant deleted successfully',
        ]);
    }

    /**
     * Get sub-processes assigned to this variant
     */
    public function getSubProcesses(ProductVariant $productVariant)
    {
        return response()->json([
            'success' => true,
            'data' => $productVariant->subProcesses()
                ->with('parentProcessTemplate')
                ->orderBy('variant_sub_processes.sequence_order')
                ->get()
        ]);
    }

    /**
     * Sync sub-processes for this variant
     */
    public function syncSubProcesses(Request $request, ProductVariant $productVariant)
    {
        $validated = $request->validate([
            'sub_processes' => 'required|array',
            'sub_processes.*.sub_process_id' => 'required|exists:sub_processes,id',
            'sub_processes.*.sequence_order' => 'required|integer|min:1',
            'sub_processes.*.weight' => 'sometimes|numeric|min:0',
        ]);

        // Build sync array with pivot data
        $syncData = [];
        foreach ($validated['sub_processes'] as $sp) {
            $syncData[$sp['sub_process_id']] = [
                'sequence_order' => $sp['sequence_order'],
                'weight' => $sp['weight'] ?? 1,
            ];
        }

        $productVariant->subProcesses()->sync($syncData);

        return response()->json([
            'success' => true,
            'message' => 'Sub-processes updated successfully',
            'data' => $productVariant->subProcesses()
                ->with('parentProcessTemplate')
                ->orderBy('variant_sub_processes.sequence_order')
                ->get()
        ]);
    }
}
