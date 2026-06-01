<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CustomerController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            \Illuminate\Support\Facades\Gate::authorize('admin-only');
            return $next($request);
        });
    }

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
        if ($perPage < 1) {
            $perPage = 15;
        }
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

        // Log incoming payload with masked PII for safety (S6)
        $logPayload = $validated;
        if (isset($logPayload['email'])) $logPayload['email'] = '***@***';
        if (isset($logPayload['phone'])) $logPayload['phone'] = '******';
        if (isset($logPayload['address'])) $logPayload['address'] = '******';

        Log::info('API: Creating customer', ['payload' => $logPayload, 'user_id' => $request->user()?->id]);

        try {
            $customer = Customer::create($validated);

            Log::info('API: Customer created', ['id' => $customer->id, 'user_id' => $request->user()?->id]);

            return response()->json([
                'success' => true,
                'message' => 'Customer created successfully',
                'data' => $customer,
            ], 201);
        } catch (\Throwable $e) {
            $errorPayload = [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id,
            ];
            if (config('app.debug')) {
                $errorPayload['trace'] = $e->getTraceAsString();
                $errorPayload['payload'] = $logPayload;
            }
            Log::error('API: Failed to create customer', $errorPayload);
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

        // Log incoming payload with masked PII for safety (S6)
        $logPayload = $validated;
        if (isset($logPayload['email'])) $logPayload['email'] = '***@***';
        if (isset($logPayload['phone'])) $logPayload['phone'] = '******';
        if (isset($logPayload['address'])) $logPayload['address'] = '******';

        Log::info('API: Updating customer', ['id' => $customer->id, 'payload' => $logPayload, 'user_id' => $request->user()?->id]);

        try {
            $customer->update($validated);

            Log::info('API: Customer updated', ['id' => $customer->id, 'user_id' => $request->user()?->id]);

            return response()->json([
                'success' => true,
                'message' => 'Customer updated successfully',
                'data' => $customer,
            ]);
        } catch (\Throwable $e) {
            $errorPayload = [
                'id' => $customer->id,
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id,
            ];
            if (config('app.debug')) {
                $errorPayload['trace'] = $e->getTraceAsString();
                $errorPayload['payload'] = $logPayload;
            }
            Log::error('API: Failed to update customer', $errorPayload);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update customer'
            ], 500);
        }
    }

    /**
     * Remove the specified customer
     */
    public function destroy(Customer $customer)
    {
        // Check if customer has associated orders or products
        if ($customer->orders()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete customer because they have active orders associated.'
            ], 400);
        }

        if ($customer->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete customer because they have associated products.'
            ], 400);
        }

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer deleted successfully',
        ]);
    }
}
