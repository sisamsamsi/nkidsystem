<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of products
     */
    public function index(Request $request)
    {
        $query = Product::with(['customer', 'variants']);

        // Filter by customer
        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('style_code', 'like', "%{$search}%");
            });
        }

        $products = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Store a newly created product with variants and processes
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'customer_id' => 'required|exists:customers,id',
            'style_code' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'variants' => 'required|array|min:1',
            'variants.*.name' => 'required|string|max:255',
            'variants.*.colors' => 'required|string',
            'variants.*.sizes' => 'required|string',
            'variants.*.image_url' => 'nullable|string|max:500',
            'variants.*.processes' => 'sometimes|array',
            'variants.*.processes.*.process_template_id' => 'required|exists:process_templates,id',
            'variants.*.processes.*.weight' => 'required|integer|min:1',
            'variants.*.processes.*.sequence_order' => 'required|integer|min:1',
        ]);

        $product = \DB::transaction(function () use ($validated) {
            $product = Product::create([
                'name' => $validated['name'],
                'customer_id' => $validated['customer_id'],
                'style_code' => $validated['style_code'] ?? null,
                'description' => $validated['description'] ?? null,
            ]);

            foreach ($validated['variants'] as $variantData) {
                $variant = $product->variants()->create([
                    'name' => $variantData['name'],
                    'colors' => $variantData['colors'],
                    'sizes' => $variantData['sizes'],
                    'image_url' => $variantData['image_url'] ?? null,
                ]);

                if (isset($variantData['processes'])) {
                    foreach ($variantData['processes'] as $processData) {
                        $variant->processes()->create($processData);
                    }
                }
            }

            return $product;
        });

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => $product->load(['variants.processes']),
        ], 201);
    }

    /**
     * Display the specified product
     */
    public function show(Product $product)
    {
        return response()->json([
            'success' => true,
            'data' => $product->load(['customer', 'variants.processes.template', 'variants.subProcesses.parentProcessTemplate']),
        ]);
    }

    /**
     * Update the specified product
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'customer_id' => 'sometimes|required|exists:customers,id',
            'style_code' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'variants' => 'sometimes|array',
            'variants.*.id' => 'sometimes|nullable|exists:product_variants,id',
            'variants.*.name' => 'required_with:variants|string|max:255',
            'variants.*.colors' => 'required_with:variants|string',
            'variants.*.sizes' => 'required_with:variants|string',
            'variants.*.image_url' => 'nullable|string|max:500',
            'variants.*.processes' => 'sometimes|array',
            'variants.*.processes.*.process_template_id' => 'required|exists:process_templates,id',
            'variants.*.processes.*.weight' => 'required|integer|min:1',
            'variants.*.processes.*.sequence_order' => 'required|integer|min:1',
        ]);

        \DB::transaction(function () use ($validated, $product) {
            $product->update(collect($validated)->except('variants')->toArray());

            if (isset($validated['variants'])) {
                $variantIds = [];
                foreach ($validated['variants'] as $variantData) {
                    if (isset($variantData['id'])) {
                        $variant = $product->variants()->findOrFail($variantData['id']);
                        $variant->update([
                            'name' => $variantData['name'],
                            'colors' => $variantData['colors'],
                            'sizes' => $variantData['sizes'],
                            'image_url' => $variantData['image_url'] ?? $variant->image_url,
                        ]);
                    } else {
                        $variant = $product->variants()->create([
                            'name' => $variantData['name'],
                            'colors' => $variantData['colors'],
                            'sizes' => $variantData['sizes'],
                            'image_url' => $variantData['image_url'] ?? null,
                        ]);
                    }
                    $variantIds[] = $variant->id;

                    // Update processes
                    if (isset($variantData['processes'])) {
                        $variant->processes()->delete();
                        foreach ($variantData['processes'] as $processData) {
                            $variant->processes()->create($processData);
                        }
                    }
                }
                // Option to delete variants NOT in the request
                $product->variants()->whereNotIn('id', $variantIds)->delete();
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $product->load(['variants.processes.template']),
        ]);
    }

    /**
     * Remove the specified product
     */
    public function destroy(Product $product)
    {
        \DB::transaction(function () use ($product) {
            foreach ($product->variants as $variant) {
                $variant->processes()->delete();
                $variant->delete();
            }
            $product->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }

    /**
     * Generate a unique Style Code
     */
    public function generateStyleCode(Request $request)
    {
        $productName = $request->input('name', '');
        
        // Extract 3 consonants from product name
        $consonants = preg_replace('/[aeiou\s\W\d]/i', '', $productName);
        $short = strtoupper(substr($consonants, 0, 3));
        if (strlen($short) < 3) {
            // Fallback if not enough consonants
            $cleanName = preg_replace('/[\s\W\d]/i', '', $productName);
            $short = strtoupper(substr($cleanName, 0, 3));
        }
        
        $year = date('Y');
        
        // Find the next sequence for this short and year
        $prefix = "STYLE-{$short}-{$year}-";
        $lastProduct = Product::where('style_code', 'like', "{$prefix}%")
            ->orderBy('style_code', 'desc')
            ->first();
            
        $sequence = 1;
        if ($lastProduct && preg_match('/-(\d+)$/', $lastProduct->style_code, $matches)) {
            $sequence = (int)$matches[1] + 1;
        }
        
        $styleCode = $prefix . str_pad($sequence, 3, '0', STR_PAD_LEFT);
        
        return response()->json([
            'success' => true,
            'style_code' => $styleCode
        ]);
    }
}
