<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'po_number', 
        'date', 
        'deadline_date',
        'customer_id', 
        'branch_id', 
        'priority', 
        'status', 
        'notes', 
        'overall_progress'
    ];

    protected $casts = [
        'date' => 'date',
        'deadline_date' => 'date',
        'customer_id' => 'integer',
        'overall_progress' => 'integer',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function shipments()
    {
        return $this->hasMany(Shipment::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
