<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class SsoCompanyUser extends Pivot
{
    protected $table = 'company_user';

    protected $primaryKey = 'id';

    public $incrementing = true;

    public $timestamps = true;

    protected $fillable = [
        'company_id',
        'user_id',
        'role',
        'status',
    ];
}
