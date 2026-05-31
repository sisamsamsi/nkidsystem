<?php

namespace App\Events;

use App\Models\ProductionTask;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskProgressUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ProductionTask $task;

    /**
     * Create a new event instance.
     */
    public function __construct(ProductionTask $task)
    {
        $this->task = $task;
    }
}
