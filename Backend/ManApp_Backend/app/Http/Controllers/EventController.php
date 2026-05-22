<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class EventController extends Controller
{
    private const CACHE_KEY = 'events.index';
    private const CACHE_TTL_SECONDS = 30;

    public function index()
    {
        $events = Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, function () {
            return Event::query()
                ->with(['user', 'status', 'files'])
                ->orderByDesc('created_at')
                ->get();
        });

        return response()->json($events);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'location' => ['required', 'string', 'max:255'],
            'status_id' => ['required', 'integer', 'exists:status,id'],
        ]);

        $event = Event::create($validated);
        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'message' => 'Event berhasil dibuat.',
            'event' => $event->load(['user', 'status', 'files']),
        ], 201);
    }

    public function show(Event $event)
    {
        return response()->json(
            $event->load(['user', 'status', 'files'])
        );
    }

    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'user_id' => ['sometimes', 'required', 'integer', 'exists:users,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'start_time' => ['sometimes', 'required', 'date'],
            'end_time' => ['sometimes', 'required', 'date'],
            'location' => ['sometimes', 'required', 'string', 'max:255'],
            'status_id' => ['sometimes', 'required', 'integer', 'exists:status,id'],
        ]);

        $startTime = $validated['start_time'] ?? $event->start_time;
        $endTime = $validated['end_time'] ?? $event->end_time;

        if (strtotime($endTime) <= strtotime($startTime)) {
            return response()->json([
                'message' => 'end_time harus lebih besar dari start_time.',
            ], 422);
        }

        $event->fill($validated);
        $event->save();
        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'message' => 'Event berhasil diupdate.',
            'event' => $event->load(['user', 'status', 'files']),
        ]);
    }

    public function destroy(Event $event)
    {
        $event->delete();
        Cache::forget(self::CACHE_KEY);

        return response()->noContent();
    }
}
