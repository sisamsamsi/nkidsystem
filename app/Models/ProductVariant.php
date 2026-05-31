<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'name', 'colors', 'sizes', 'image_url', 'price'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function processes()
    {
        return $this->hasMany(VariantProcess::class);
    }

    /**
     * Get sub-processes for this variant (for SEWING/FINISHING)
     */
    public function subProcesses()
    {
        return $this->belongsToMany(SubProcess::class, 'variant_sub_processes')
                    ->withPivot('sequence_order', 'weight')
                    ->orderByPivot('sequence_order')
                    ->withTimestamps();
    }
}
