<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VariantSubProcess extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_variant_id',
        'sub_process_id',
        'sequence_order',
        'weight',
    ];

    protected $casts = [
        'weight' => 'decimal:2',
    ];

    /**
     * Get the product variant
     */
    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the sub-process
     */
    public function subProcess()
    {
        return $this->belongsTo(SubProcess::class);
    }
}
