<?php

namespace Database\Seeders;

use App\Models\Status;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Wulan Purnamasari',
            'email' => 'wulan.purnamasari@ciputra.ac.id',
            'password' => Hash::make('wulan.purnamasari'),
        ]);

        User::factory()->create([
            'name' => 'Andi Muh. Akbar Fatir',
            'email' => 'amuh0003@student.ciputra.ac.id',
            'password' => Hash::make('amuh0003'),
        ]);

        User::factory()->create([
            'name' => 'Dylon Xi Fernando',
            'email' => 'dgongxi01@student.ciputra.ac.id',
            'password' => Hash::make('dgongxi01'),
        ]);

        Status::factory()->create([
            'code' => 'B',
            'status' => 'Belum Ada',
        ]);

        Status::factory()->create([
            'code' => 'R',
            'status' => 'Revisi',
        ]);

        Status::factory()->create([
            'code' => 'S',
            'status' => 'Selesai',
        ]);

        #$this->call(EventSeeder::class);
        #$this->call(FileSeeder::class);
    }
}
