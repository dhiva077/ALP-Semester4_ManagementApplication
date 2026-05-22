<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->text('revisi_form_checklist_sebelum_acara')->nullable();
            $table->text('revisi_surat_perjanjian_kerjasama')->nullable();
            $table->text('revisi_invoice')->nullable();
            $table->text('revisi_lembar_disposisi')->nullable();
            $table->text('revisi_surat_izin_loading')->nullable();
            $table->text('revisi_form_checklist_setelah_acara')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->dropColumn([
                'revisi_form_checklist_sebelum_acara',
                'revisi_surat_perjanjian_kerjasama',
                'revisi_invoice',
                'revisi_lembar_disposisi',
                'revisi_surat_izin_loading',
                'revisi_form_checklist_setelah_acara',
            ]);
        });
    }
};
