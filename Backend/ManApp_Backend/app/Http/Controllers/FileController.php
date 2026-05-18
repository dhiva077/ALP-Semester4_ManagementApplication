<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Status;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;

class FileController extends Controller
{
    private function attachUrls(File $file, Request $request): File
    {
        $host = $request->getSchemeAndHttpHost();
        $columns = [
            'form_checklist_sebelum_acara',
            'surat_perjanjian_kerjasama',
            'invoice',
            'lembar_disposisi',
            'surat_izin_loading',
            'form_checklist_setelah_acara',
        ];

        foreach ($columns as $column) {
            $path = $file->{$column};
            $file->setAttribute(
                $column . '_url',
                $path ? $host . Storage::url($path) : null
            );
        }

        return $file;
    }

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
            ->get()
            ->map(fn (File $file) => $this->attachUrls($file, request()));

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
            'file' => $this->attachUrls($file->load([
                'event',
                'statusFormChecklistSebelumAcara',
                'statusSuratPerjanjianKerjasama',
                'statusInvoice',
                'statusLembarDisposisi',
                'statusSuratIzinLoading',
                'statusFormChecklistSetelahAcara',
            ]), $request),
        ], 201);
    }

    public function show(File $file)
    {
        return response()->json(
            $this->attachUrls($file->load([
                'event',
                'statusFormChecklistSebelumAcara',
                'statusSuratPerjanjianKerjasama',
                'statusInvoice',
                'statusLembarDisposisi',
                'statusSuratIzinLoading',
                'statusFormChecklistSetelahAcara',
            ]), request())
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
            'file' => $this->attachUrls($file->load([
                'event',
                'statusFormChecklistSebelumAcara',
                'statusSuratPerjanjianKerjasama',
                'statusInvoice',
                'statusLembarDisposisi',
                'statusSuratIzinLoading',
                'statusFormChecklistSetelahAcara',
            ]), $request),
        ]);
    }

    public function destroy(File $file)
    {
        $file->delete();

        return response()->noContent();
    }

    public function upload(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'pdf_file' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ]);

        $eventId = $validated['event_id'];
        $pdfFile = $validated['pdf_file'];

        // Parse PDF using pure PHP
        $parser = new Parser();
        $pdf = $parser->parseFile($pdfFile->getRealPath());
        $text = $pdf->getText();

        $lowerText = strtolower($text);

        $documentMappings = [
            'form_checklist_sebelum_acara' => [
                'form_checklist_sebelum_acara',
                'checklist sebelum',
                'sebelum acara',
                'form checklist sebelum',
                'pre-event',
                'pre event',
                'persiapan acara',
                'persiapan event',
                'daftar periksa sebelum',
                'checklist preparation',
                'persiapan'
            ],
            'surat_perjanjian_kerjasama'   => [
                'surat_perjanjian_kerjasama',
                'perjanjian kerjasama',
                'surat perjanjian',
                'spk',
                'mou',
                'memorandum of understanding',
                'kontrak',
                'contract',
                'agreement',
                'kesepakatan',
                'kerja sama',
                'surat kontrak',
                'surat kesepakatan'
            ],
            'invoice'                      => [
                'invoice',
                'faktur',
                'tagihan',
                'receipt',
                'nota',
                'pembayaran',
                'payment',
                'bill',
                'bukti bayar',
                'kwitansi',
                'kuitansi',
                'struk'
            ],
            'lembar_disposisi'             => [
                'lembar_disposisi',
                'lembar disposisi',
                'disposisi',
                'surat tugas',
                'penugasan',
                'assignment',
                'mandat',
                'lembar pengantar',
                'instruksi kerja',
                'surat pengantar',
                'nota dinas',
                'memo'
            ],
            'surat_izin_loading'           => [
                'surat_izin_loading',
                'izin loading',
                'surat izin',
                'loading',
                'surat izin loading',
                'loading permit',
                'izin masuk',
                'izin bongkar muat',
                'surat jalan',
                'izin kerja',
                'work permit',
                'clearance',
                'izin bongkar'
            ],
            'form_checklist_setelah_acara' => [
                'form_checklist_setelah_acara',
                'checklist setelah',
                'setelah acara',
                'form checklist setelah',
                'post-event',
                'post event',
                'evaluasi acara',
                'penutupan acara',
                'daftar periksa setelah',
                'berita acara penyelesaian',
                'bap',
                'handover'
            ],
        ];

        $type = null;

        foreach ($documentMappings as $column => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($lowerText, $keyword)) {
                    $type = $column;
                    break 2;
                }
            }
        }

        if (!$type) {
            return response()->json([
                'message' => 'Jenis dokumen tidak dikenali.'
            ], 400);
        }

        $filename = $eventId . '_' . $type . '.pdf';

        $path = Storage::disk('public')->putFileAs('files', $pdfFile, $filename);

        $defaultStatusId = Status::where('code', 'B')->value('id');

        $file = File::firstOrCreate(
            ['event_id' => $eventId],
            [
                'status_form_checklist_sebelum_acara_id' => $defaultStatusId,
                'status_surat_perjanjian_kerjasama_id' => $defaultStatusId,
                'status_invoice_id' => $defaultStatusId,
                'status_lembar_disposisi_id' => $defaultStatusId,
                'status_surat_izin_loading_id' => $defaultStatusId,
                'status_form_checklist_setelah_acara_id' => $defaultStatusId,
            ]
        );

        $file->$type = $path;

        $statusColumn = 'status_' . $type . '_id';

        if (isset($file->$statusColumn) || in_array($statusColumn, array_keys($file->getAttributes()))) {
            $file->$statusColumn = Status::where('code', 'S')->value('id');
        }

        $file->save();

        return response()->json([
            'message' => 'File berhasil diupload.',
            'type' => $type,
            'filename' => $filename,
            'path' => $path,
            'url' => $request->getSchemeAndHttpHost() . Storage::url($path),
            'text_preview' => substr($text, 0, 200),
        ]);
    }

    public function updateStatus(Request $request)
    {
        $allowedDocKeys = [
            'form_checklist_sebelum_acara',
            'surat_perjanjian_kerjasama',
            'invoice',
            'lembar_disposisi',
            'surat_izin_loading',
            'form_checklist_setelah_acara',
        ];

        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'doc_key' => ['required', 'string', 'in:' . implode(',', $allowedDocKeys)],
            'status_code' => ['required', 'string', 'in:B,R,S'], // B = Belum, R = Revisi, S = Selesai
        ]);

        $eventId = $validated['event_id'];
        $docKey = $validated['doc_key'];
        $statusCode = $validated['status_code'];

        $file = File::where('event_id', $eventId)->first();

        if (!$file) {
            return response()->json(['message' => 'File belum diunggah untuk event ini.'], 404);
        }

        $statusColumn = 'status_' . $docKey . '_id';
        $statusId = Status::where('code', $statusCode)->value('id');

        $file->$statusColumn = $statusId;
        if ($statusCode === 'B') {
            $file->$docKey = null;
        }
        $file->save();

        return response()->json([
            'message' => 'Status berhasil diperbarui.',
            'status_code' => $statusCode
        ]);
    }

}
