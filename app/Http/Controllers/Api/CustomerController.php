<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers
     */
    public function index(Request $request)
    {
        $query = Customer::query();

        // Search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->get('per_page', 15);
        if ($perPage > 100) {
            $perPage = 100;
        }

        $customers = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    /**
     * Store a newly created customer
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|unique:customers',
            'brand' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        // Log incoming payload for debugging/audit
        Log::info('API: Creating customer', ['payload' => $validated, 'user_id' => $request->user()?->id]);

        try {
            $customer = Customer::create($validated);

            Log::info('API: Customer created', ['id' => $customer->id, 'customer' => $customer->toArray(), 'user_id' => $request->user()?->id]);

            return response()->json([
                'success' => true,
                'message' => 'Customer created successfully',
                'data' => $customer,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('API: Failed to create customer', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'payload' => $validated, 'user_id' => $request->user()?->id]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan customer'
            ], 500);
        }
    }

    /**
     * Display the specified customer
     */
    public function show(Customer $customer)
    {
        return response()->json([
            'success' => true,
            'data' => $customer->load(['products', 'orders']),
        ]);
    }

    /**
     * Update the specified customer
     */
    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|unique:customers,code,' . $customer->id,
            'brand' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        Log::info('API: Updating customer', ['id' => $customer->id, 'payload' => $validated, 'user_id' => $request->user()?->id]);

        try {
            $customer->update($validated);

            Log::info('API: Customer updated', ['id' => $customer->id, 'customer' => $customer->toArray(), 'user_id' => $request->user()?->id]);

            return response()->json([
                'success' => true,
                'message' => 'Customer updated successfully',
                'data' => $customer,
            ]);
        } catch (\Throwable $e) {
            Log::error('API: Failed to update customer', ['id' => $customer->id, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString(), 'payload' => $validated, 'user_id' => $request->user()?->id]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui customer'
            ], 500);
        }
    }

    /**
     * Remove the specified customer
     */
    public function destroy(Customer $customer)
    {
        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer deleted successfully',
        ]);
    }
}
