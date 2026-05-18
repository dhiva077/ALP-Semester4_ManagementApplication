<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;

abstract class Controller
{
    /**
     * Send a push notification using Expo
     */
    public function sendPushNotification($user, $title, $body, $data = [])
    {
        if (!$user->expo_push_token) {
            return; // User hasn't registered a device
        }

        $response = Http::post('https://exp.host/--/api/v2/push/send', [
            'to' => $user->expo_push_token,
            'sound' => 'default',
            'title' => $title,
            'body' => $body,
            'data' => $data
        ]);

        return $response->json();
    }
}
