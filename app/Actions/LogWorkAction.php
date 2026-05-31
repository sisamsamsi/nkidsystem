<?php

namespace App\Actions;

use App\Models\ProductionTask;
use App\Models\WorkLog;
use App\Events\TaskProgressUpdated;
use Illuminate\Support\Facades\DB;

class LogWorkAction
{
    /**
     * Execute atomic work logging with snapshot update
     *
     * @param int $taskId
     * @param int $userId
     * @param int $quantity
     * @param string|null $notes
     * @return array
     * @throws \Exception
     */
    public function execute(int $taskId, int $userId, int $quantity, ?string $notes = null): array
    {
        return DB::transaction(function () use ($taskId, $userId, $quantity, $notes) {
            // Lock the task row to prevent race conditions
            $task = ProductionTask::lockForUpdate()->findOrFail($taskId);
            $orderItem = $task->orderItem;

            // Calculate remaining quantity
            $totalRequired = $orderItem->quantity;
            $alreadyCompleted = $task->completed_quantity;
            $remaining = $totalRequired - $alreadyCompleted;

            // Validate quantity doesn't exceed remaining
            if ($quantity > $remaining) {
                throw new \Exception("Cannot log more than remaining quantity ({$remaining} pcs)");
            }

            // Create work log entry
            $workLog = WorkLog::create([
                'production_task_id' => $task->id,
                'user_id' => $userId,
                'quantity' => $quantity,
                'notes' => $notes,
            ]);

            // Update task snapshot (NO SUM query needed - this is the key!)
            $newCompleted = $alreadyCompleted + $quantity;
            $task->completed_quantity = $newCompleted;
            $task->progress_percent = $this->calculateProgress($newCompleted, $totalRequired);
            
            // Update status based on progress
            $task->status = $this->determineStatus($task->progress_percent, $task->status);
            
            // Set dates
            if ($task->status === 'in_progress' && !$task->start_date) {
                $task->start_date = now();
            }
            if ($task->status === 'completed' && !$task->end_date) {
                $task->end_date = now();
            }
            
            $task->save();

            // Dispatch event for async order progress recalculation
            TaskProgressUpdated::dispatch($task);

            return [
                'work_log' => $workLog,
                'task' => $task->fresh(),
                'remaining' => $totalRequired - $newCompleted,
            ];
        });
    }

    /**
     * Calculate progress percentage
     */
    private function calculateProgress(int $completed, int $total): int
    {
        if ($total <= 0) return 0;
        return min(100, round(($completed / $total) * 100));
    }

    /**
     * Determine task status based on progress
     */
    private function determineStatus(int $progress, string $currentStatus): string
    {
        if ($progress >= 100) {
            return 'completed';
        }
        if ($progress > 0 || $currentStatus === 'in_progress') {
            return 'in_progress';
        }
        return 'pending';
    }
}
