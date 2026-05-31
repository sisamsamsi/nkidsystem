<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubProcess extends Model
{
    use HasFactory;

    protected $fillable = [
        'parent_process_template_id',
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the parent process template (SEWING, FINISHING, etc.)
     */
    public function parentProcessTemplate()
    {
        return $this->belongsTo(ProcessTemplate::class, 'parent_process_template_id');
    }

    /**
     * Get the variants that use this sub-process
     */
    public function variants()
    {
        return $this->belongsToMany(ProductVariant::class, 'variant_sub_processes')
                    ->withPivot('sequence_order', 'weight')
                    ->withTimestamps();
    }

    /**
     * Get production tasks for this sub-process
     */
    public function productionTasks()
    {
        return $this->hasMany(ProductionTask::class);
    }
}
