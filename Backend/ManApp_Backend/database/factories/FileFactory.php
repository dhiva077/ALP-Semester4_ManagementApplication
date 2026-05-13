<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Status;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<File>
 */
class FileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $event = Event::query()->inRandomOrder()->first();
        $status = Status::query()->inRandomOrder()->first();

        return [
            'event_id' => $event?->id ?? 1,
            'form_checklist_sebelum_acara' => fake()->optional()->word(),
            'status_form_checklist_sebelum_acara_id' => $status?->id ?? 1,
            'surat_perjanjian_kerjasama' => fake()->optional()->word(),
            'status_surat_perjanjian_kerjasama_id' => $status?->id ?? 1,
            'invoice' => fake()->optional()->word(),
            'status_invoice_id' => $status?->id ?? 1,
            'lembar_disposisi' => fake()->optional()->word(),
            'status_lembar_disposisi_id' => $status?->id ?? 1,
            'surat_izin_loading' => fake()->optional()->word(),
            'status_surat_izin_loading_id' => $status?->id ?? 1,
            'form_checklist_setelah_acara' => fake()->optional()->word(),
            'status_form_checklist_setelah_acara_id' => $status?->id ?? 1,
        ];
    }
}
