<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProcessTemplate extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'default_weight', 'parallel_allowed'];
}
