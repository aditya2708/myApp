<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Support\SsoContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'role:admin_shelter']);
    }

    public function index(Request $request, ?SsoContext $context = null): JsonResponse
    {
        $companyId = $context?->company()?->id;

        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->get()
            ->filter(function (DatabaseNotification $notification) use ($companyId) {
                if (!$companyId) {
                    return true;
                }

                $notifCompanyId = data_get($notification->data, 'company_id');

                return $notifCompanyId === null || (int) $notifCompanyId === (int) $companyId;
            })
            ->values()
            ->map(function (DatabaseNotification $notification) {
                return [
                    'id' => $notification->id,
                    'title' => data_get($notification->data, 'title', ''),
                    'message' => data_get($notification->data, 'message', ''),
                    'is_read' => $notification->read_at !== null,
                    'created_at' => optional($notification->created_at)->toISOString(),
                ];
            });

        return response()->json([
            'data' => $notifications,
        ]);
    }

    public function markAsRead(Request $request, DatabaseNotification $notification, ?SsoContext $context = null): JsonResponse
    {
        $user = $request->user();
        $companyId = $context?->company()?->id;

        if ($notification->notifiable_id !== $user->getKey() ||
            $notification->notifiable_type !== $user->getMorphClass()) {
            abort(403, 'Unauthorized');
        }

        if ($companyId) {
            $notifCompanyId = data_get($notification->data, 'company_id');
            if ($notifCompanyId !== null && (int) $notifCompanyId !== (int) $companyId) {
                abort(403, 'Notification does not belong to current company');
            }
        }

        if ($notification->read_at === null) {
            $notification->markAsRead();
            $notification->refresh();
        }

        return response()->json([
            'message' => 'Notification marked as read',
            'data' => [
                'id' => $notification->id,
                'title' => data_get($notification->data, 'title', ''),
                'message' => data_get($notification->data, 'message', ''),
                'is_read' => $notification->read_at !== null,
                'created_at' => optional($notification->created_at)->toISOString(),
            ],
        ]);
    }
}
