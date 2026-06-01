<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkLog extends Model
{
    use HasFactory;

    protected $fillable = ['production_task_id', 'user_id', 'quantity', 'notes'];

    protected $casts = [
        'production_task_id' => 'integer',
        'user_id' => 'integer',
        'quantity' => 'integer',
    ];

    public function task()
    {
        return $this->belongsTo(ProductionTask::class, 'production_task_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
