<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class File extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'files';

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->created_by = Auth::id();
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'event_id',
        'form_checklist_sebelum_acara',
        'status_form_checklist_sebelum_acara_id',
        'surat_perjanjian_kerjasama',
        'status_surat_perjanjian_kerjasama_id',
        'invoice',
        'status_invoice_id',
        'lembar_disposisi',
        'status_lembar_disposisi_id',
        'surat_izin_loading',
        'status_surat_izin_loading_id',
        'form_checklist_setelah_acara',
        'status_form_checklist_setelah_acara_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'form_checklist_sebelum_acara' => 'string',
            'status_form_checklist_sebelum_acara_id' => 'string',
            'surat_perjanjian_kerjasama' => 'string',
            'status_surat_perjanjian_kerjasama_id' => 'string',
            'invoice' => 'string',
            'status_invoice_id' => 'string',
            'lembar_disposisi' => 'string',
            'status_lembar_disposisi_id' => 'string',
            'surat_izin_loading' => 'string',
            'status_surat_izin_loading_id' => 'string',
            'form_checklist_setelah_acara' => 'string',
            'status_form_checklist_setelah_acara_id' => 'string',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function statusFormChecklistSebelumAcara(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'status_form_checklist_sebelum_acara_id');
    }

    public function statusSuratPerjanjianKerjasama(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'status_surat_perjanjian_kerjasama_id');
    }

    public function statusInvoice(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'status_invoice_id');
    }

    public function statusLembarDisposisi(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'status_lembar_disposisi_id');
    }

    public function statusSuratIzinLoading(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'status_surat_izin_loading_id');
    }

    public function statusFormChecklistSetelahAcara(): BelongsTo
    {
        return $this->belongsTo(Status::class, 'status_form_checklist_setelah_acara_id');
    }
}
