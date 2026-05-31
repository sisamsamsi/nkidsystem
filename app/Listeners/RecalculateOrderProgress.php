<?php

namespace App\Listeners;

use App\Actions\RecalculateProgressAction;
use App\Events\TaskProgressUpdated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class RecalculateOrderProgress implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The number of times the queued listener may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds before the job should be retried.
     */
    public int $backoff = 5;

    private RecalculateProgressAction $recalculateAction;

    /**
     * Create the event listener.
     */
    public function __construct(RecalculateProgressAction $recalculateAction)
    {
        $this->recalculateAction = $recalculateAction;
    }

    /**
     * Handle the event.
     * 
     * This runs asynchronously in the queue, so it doesn't block the UI
     */
    public function handle(TaskProgressUpdated $event): void
    {
        $this->recalculateAction->execute($event->task);
    }
}
