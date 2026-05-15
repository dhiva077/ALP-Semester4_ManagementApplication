<?php

namespace App\Http\Controllers;

use App\Models\File;
use Illuminate\Http\Request;

class FileController extends Controller
{
    public function index()
    {
        $files = File::query()
            ->with([
                'event',
                'statusFormChecklistSebelumAcara',
                'statusSuratPerjanjianKerjasama',
                'statusInvoice',
                'statusLembarDisposisi',
                'statusSuratIzinLoading',
                'statusFormChecklistSetelahAcara',
            ])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($files);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'form_checklist_sebelum_acara' => ['nullable', 'string'],
            'status_form_checklist_sebelum_acara_id' => ['nullable', 'integer', 'exists:status,id'],
            'surat_perjanjian_kerjasama' => ['nullable', 'string'],
            'status_surat_perjanjian_kerjasama_id' => ['nullable', 'integer', 'exists:status,id'],
            'invoice' => ['nullable', 'string'],
            'status_invoice_id' => ['nullable', 'integer', 'exists:status,id'],
            'lembar_disposisi' => ['nullable', 'string'],
            'status_lembar_disposisi_id' => ['nullable', 'integer', 'exists:status,id'],
            'surat_izin_loading' => ['nullable', 'string'],
            'status_surat_izin_loading_id' => ['nullable', 'integer', 'exists:status,id'],
            'form_checklist_setelah_acara' => ['nullable', 'string'],
            'status_form_checklist_setelah_acara_id' => ['nullable', 'integer', 'exists:status,id'],
        ]);

        $file = File::create($validated);

        return response()->json([
            'message' => 'File berhasil dibuat.',
            'file' => $file->load([
                'event',
                'statusFormChecklistSebelumAcara',
                'statusSuratPerjanjianKerjasama',
                'statusInvoice',
                'statusLembarDisposisi',
                'statusSuratIzinLoading',
                'statusFormChecklistSetelahAcara',
            ]),
        ], 201);
    }

    public function show(File $file)
    {
        return response()->json(
            $file->load([
                'event',
                'statusFormChecklistSebelumAcara',
                'statusSuratPerjanjianKerjasama',
                'statusInvoice',
                'statusLembarDisposisi',
                'statusSuratIzinLoading',
                'statusFormChecklistSetelahAcara',
            ])
        );
    }

    public function update(Request $request, File $file)
    {
        $validated = $request->validate([
            'event_id' => ['sometimes', 'required', 'integer', 'exists:events,id'],
            'form_checklist_sebelum_acara' => ['sometimes', 'nullable', 'string'],
            'status_form_checklist_sebelum_acara_id' => ['sometimes', 'nullable', 'integer', 'exists:status,id'],
            'surat_perjanjian_kerjasama' => ['sometimes', 'nullable', 'string'],
            'status_surat_perjanjian_kerjasama_id' => ['sometimes', 'nullable', 'integer', 'exists:status,id'],
            'invoice' => ['sometimes', 'nullable', 'string'],
            'status_invoice_id' => ['sometimes', 'nullable', 'integer', 'exists:status,id'],
            'lembar_disposisi' => ['sometimes', 'nullable', 'string'],
            'status_lembar_disposisi_id' => ['sometimes', 'nullable', 'integer', 'exists:status,id'],
            'surat_izin_loading' => ['sometimes', 'nullable', 'string'],
            'status_surat_izin_loading_id' => ['sometimes', 'nullable', 'integer', 'exists:status,id'],
            'form_checklist_setelah_acara' => ['sometimes', 'nullable', 'string'],
            'status_form_checklist_setelah_acara_id' => ['sometimes', 'nullable', 'integer', 'exists:status,id'],
        ]);

        $file->fill($validated);
        $file->save();

        return response()->json([
            'message' => 'File berhasil diupdate.',
            'file' => $file->load([
                'event',
                'statusFormChecklistSebelumAcara',
                'statusSuratPerjanjianKerjasama',
                'statusInvoice',
                'statusLembarDisposisi',
                'statusSuratIzinLoading',
                'statusFormChecklistSetelahAcara',
            ]),
        ]);
    }

    public function destroy(File $file)
    {
        $file->delete();

        return response()->noContent();
    }
}
