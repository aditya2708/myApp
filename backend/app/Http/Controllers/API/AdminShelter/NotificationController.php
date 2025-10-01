<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'role:admin_shelter']);
    }

    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->get()
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

    public function markAsRead(Request $request, DatabaseNotification $notification): JsonResponse
    {
        $user = $request->user();

        if ($notification->notifiable_id !== $user->getKey() ||
            $notification->notifiable_type !== $user->getMorphClass()) {
            abort(403, 'Unauthorized');
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
