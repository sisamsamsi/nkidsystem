<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VariantProcess extends Model
{
    use HasFactory;

    protected $fillable = ['product_variant_id', 'process_template_id', 'weight', 'sequence_order'];

    protected $casts = [
        'product_variant_id' => 'integer',
        'process_template_id' => 'integer',
        'weight' => 'integer',
        'sequence_order' => 'integer',
    ];

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function template()
    {
        return $this->belongsTo(ProcessTemplate::class, 'process_template_id');
    }
}
