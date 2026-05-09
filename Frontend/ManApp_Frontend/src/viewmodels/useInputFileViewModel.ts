import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';

interface SelectedFile {
  name: string;
  uri: string;
}

export default function useInputFileViewModel() {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Kamu bisa ganti ke ['application/pdf', 'application/vnd.ms-excel'] jika ingin spesifik
        copyToCacheDirectory: true,
        multiple: true, // INI KUNCINYA agar user bisa pilih banyak file sekaligus
      });

      if (!result.canceled) {
        // Map semua asset yang dipilih ke state
        const newFiles = result.assets.map((asset) => ({
          name: asset.name,
          uri: asset.uri,
        }));

        // Gabungkan dengan file yang sudah ada sebelumnya
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (err) {
      console.error("Gagal mengambil dokumen:", err);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  return {
    selectedFiles,
    handlePickFile,
    removeFile,
    clearAllFiles,
  };
}