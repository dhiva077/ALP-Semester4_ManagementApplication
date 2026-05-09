<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Status;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startTime = fake()->dateTimeBetween('+1 week', '+2 months');
        $endTime = (clone $startTime)->modify('+'.fake()->numberBetween(1, 6).' hours');

        return [
            'user_id' => User::query()->inRandomOrder()->first()?->id ?? 1,
            'name' => fake()->sentence(4),
            'description' => fake()->optional()->paragraph(),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'location' => fake()->randomElement([
                'Auditorium',
                'Ruang Rapat 1',
                'Lapangan Utama',
                'Hall Kampus',
                'Gedung Serbaguna',
            ]),
            'status_id' => Status::query()->inRandomOrder()->first()?->id ?? 1,
        ];
    }
}