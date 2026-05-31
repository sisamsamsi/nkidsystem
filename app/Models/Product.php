<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'customer_id', 'style_code', 'description'];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }
}
