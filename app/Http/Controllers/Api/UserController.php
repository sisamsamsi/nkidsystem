<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            \Illuminate\Support\Facades\Gate::authorize('admin-only');
            return $next($request);
        })->only(['index', 'store', 'update', 'destroy', 'show']);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('division')) {
            $query->where('division', $request->division);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Return flat list if paginate=false is requested or if role=operator is requested (like in stasiun dropdown)
        if ($request->get('paginate') === 'false' || $request->get('role') === 'operator') {
            $users = $query->latest()->limit(500)->get(); // Limit to prevent large payloads
            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        }

        $perPage = (int) $request->get('per_page', 15);
        if ($perPage > 100) {
            $perPage = 100;
        }

        $users = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'current_page' => $users->currentPage(),
            'last_page' => $users->lastPage(),
            'total' => $users->total(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'nullable|string|min:8|required_if:role,admin',
            'pin_code' => 'nullable|string|size:6|required_if:is_station,true',
            'role' => 'required|string|in:admin,operator,qc',
            'division' => 'nullable|string',
            'is_station' => 'boolean',
        ]);

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'] ?? null,
            'role' => $validated['role'],
            'division' => $validated['division'] ?? null,
            'is_station' => $validated['is_station'] ?? false,
            'pin_code' => !empty($validated['pin_code']) ? Hash::make($validated['pin_code']) : null,
        ];

        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        $user = User::create($userData);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['nullable', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'pin_code' => 'nullable|string|size:6',
            'role' => 'sometimes|required|string|in:admin,operator,qc',
            'division' => 'nullable|string',
            'is_station' => 'boolean',
        ]);

        $userData = [];
        if (isset($validated['name'])) $userData['name'] = $validated['name'];
        if (isset($validated['email'])) $userData['email'] = $validated['email'];
        if (isset($validated['role'])) $userData['role'] = $validated['role'];
        if (array_key_exists('division', $validated)) $userData['division'] = $validated['division'];
        if (isset($validated['is_station'])) {
            $userData['is_station'] = $validated['is_station'];
        }

        if ($request->has('pin_code')) {
            $userData['pin_code'] = !empty($validated['pin_code']) ? Hash::make($validated['pin_code']) : null;
        }

        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        $user->update($userData);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        // Prevent deleting yourself
        if (auth()->id() === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.'
            ], 403);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }
}
