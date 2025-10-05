<?php

namespace App\Helper;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Event;
use Livewire\Component;
use App\Models\System\Audit;

class Auditing
{
    public static function log($type, $user_id, $action, $notes = null){

        ## If in local or development environment, do not log audits.
        if(config('app.env') == 'local' || config('app.env') == 'development'){
            return;
        }

        $audit = new Audit();
        $audit->type = $type;
        $audit->user_id = $user_id;
        $audit->action = $action;
        $audit->notes = $notes;
        $audit->save();
    }
}
