<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QcReport extends Model
{
    use HasFactory;

    protected $fillable = ['production_task_id', 'inspector_id', 'passed_quantity', 'reject_quantity', 'reject_reason', 'notes'];

    public function task()
    {
        return $this->belongsTo(ProductionTask::class, 'production_task_id');
    }

    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }
}
