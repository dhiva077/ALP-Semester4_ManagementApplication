import { getDocumentAsync } from 'expo-document-picker';

export async function pickDocument() {
  try {
    const result = await getDocumentAsync({
      type: [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
    });

    if (!result.canceled) {
      return result.assets[0];
    }

    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
}