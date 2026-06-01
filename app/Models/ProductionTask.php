<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductionTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_item_id', 
        'process_template_id', 
        'sub_process_id',
        'status', 
        'progress_percent', 
        'completed_quantity', 
        'start_date', 
        'end_date'
    ];

    protected $casts = [
        'order_item_id' => 'integer',
        'process_template_id' => 'integer',
        'sub_process_id' => 'integer',
        'progress_percent' => 'integer',
        'completed_quantity' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function processTemplate()
    {
        return $this->belongsTo(ProcessTemplate::class);
    }

    public function subProcess()
    {
        return $this->belongsTo(SubProcess::class);
    }

    public function workLogs()
    {
        return $this->hasMany(WorkLog::class);
    }

    public function assignments()
    {
        return $this->hasMany(TaskAssignment::class);
    }

    public function qcReports()
    {
        return $this->hasMany(QcReport::class);
    }
}
