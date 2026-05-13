import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';

interface SelectedFile {
  name: string;
  uri: string;
}

export default function EditEvent() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const initialEventName = typeof params.eventName === 'string' ? params.eventName : '';
  const initialEventDate = typeof params.eventDate === 'string' ? params.eventDate : '';

  const [picName, setPicName] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [originalEventId, setOriginalEventId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  const STORAGE_KEY = 'MANAPP_EVENTS';

  const handleBackToChecklist = () => {
    router.replace({
      pathname: '/checklist',
      params: { eventName: eventName, eventDate: eventDate },
    });
  };

  const checkIsLocked = (dateStr: string) => {
    if (!dateStr) return false;
    const eventD = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = eventD.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  useEffect(() => {
    const loadExistingEvent = async () => {
      if (!initialEventDate || !initialEventName) {
        setLoading(false);
        return;
      }
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const savedEvents = stored ? JSON.parse(stored) : {};
        const eventList = savedEvents[initialEventDate] || [];
        const foundEvent = eventList.find((item: any) => item.title === initialEventName);

        if (foundEvent) {
          if (!foundEvent.picName) {
            const randomPIC = Math.random() < 0.5 ? 'Dylon' : 'Fathir';
            setPicName(randomPIC);
          } else {
            setPicName(foundEvent.picName);
          }

          setEventName(foundEvent.title);
          setEventDate(initialEventDate);
          setLocation(foundEvent.location || '');
          const [start, end] = foundEvent.time?.split(' - ') || ['', ''];
          setStartTime(start || '');
          setEndTime(end || '');
          setOriginalEventId(foundEvent.id);
          setDescription(foundEvent.description || '');
          if (Array.isArray(foundEvent.files)) {
            setSelectedFiles(foundEvent.files);
          }
          setIsLocked(checkIsLocked(initialEventDate));
        }
      } catch (error) {
        console.error('Failed to load event', error);
      } finally {
        setLoading(false);
      }
    };
    loadExistingEvent();
  }, [initialEventDate, initialEventName]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (!result.canceled) {
        const newFiles = result.assets.map((asset) => ({ name: asset.name, uri: asset.uri }));
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (err) {
      Alert.alert('Error', 'Gagal mengambil file.');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateAndSave = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const savedEvents = stored ? JSON.parse(stored) : {};
      
      const updatedEvent = {
        id: originalEventId,
        title: eventName,
        location: location,
        time: endTime ? `${startTime} - ${endTime}` : startTime,
        color: isLocked ? '#606C38' : '#FF8C00',
        picName: picName,
        description: description,
        files: selectedFiles,
      };

      const currentDayEvents = savedEvents[eventDate] || [];
      const index = currentDayEvents.findIndex((item: any) => item.id === originalEventId);

      if (index > -1) {
        currentDayEvents[index] = updatedEvent;
      }

      savedEvents[eventDate] = currentDayEvents;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedEvents));
      Alert.alert('Sukses', 'Data berhasil diperbarui.');
      handleBackToChecklist();
    } catch (error) {
      Alert.alert('Gagal', 'Terjadi kesalahan saat menyimpan.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToChecklist} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isLocked ? 'Lengkapi Data' : 'Edit Event'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLocked && (
          <View style={styles.lockBanner}>
            <Ionicons name="information-circle" size={20} color="#2E7D32" />
            <Text style={styles.lockText}>
              Jadwal sudah dikunci (H-7). Silakan lengkapi deskripsi dan lampiran berkas.
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Informasi Utama</Text>
        <View style={[styles.inputContainer, isLocked && styles.disabledInput]}>
          <Ionicons name="people-outline" size={20} color={isLocked ? '#AAA' : '#8D6E63'} style={styles.icon} />
          <TextInput
            value={picName}
            onChangeText={setPicName}
            editable={!isLocked}
            style={[styles.input, styles.boldText, isLocked && styles.textDisabled]}
            placeholder="Nama PIC Event"
          />
        </View>

        <View style={[styles.inputContainer, isLocked && styles.disabledInput]}>
          <Ionicons name="person-add-outline" size={20} color={isLocked ? '#AAA' : '#8D6E63'} style={styles.icon} />
          <TextInput
            value={eventName}
            onChangeText={setEventName}
            editable={!isLocked}
            style={[styles.input, styles.boldText, isLocked && styles.textDisabled]}
            placeholder="Nama Event"
          />
        </View>

        <View style={[styles.inputContainer, isLocked && styles.disabledInput]}>
          <Ionicons name="calendar-outline" size={20} color={isLocked ? '#AAA' : '#8D6E63'} style={styles.icon} />
          <TextInput
            value={eventDate}
            onChangeText={setEventDate}
            editable={!isLocked}
            style={[styles.input, styles.boldText, isLocked && styles.textDisabled]}
            placeholder="YYYY-MM-DD"
          />
          {isLocked && <Ionicons name="lock-closed" size={16} color="#AAA" />}
        </View>

        <View style={[styles.inputContainer, isLocked && styles.disabledInput]}>
          <Ionicons name="location-outline" size={20} color={isLocked ? '#AAA' : '#8D6E63'} style={styles.icon} />
          <TextInput
            value={location}
            onChangeText={setLocation}
            editable={!isLocked}
            style={[styles.input, styles.boldText, isLocked && styles.textDisabled]}
            placeholder="Lokasi Event"
          />
        </View>

        <View style={styles.timeRow}>
          <View style={[styles.inputContainer, { flex: 1 }, isLocked && styles.disabledInput]}>
            <Ionicons name="time-outline" size={20} color={isLocked ? '#AAA' : '#8D6E63'} style={styles.icon} />
            <TextInput
              value={startTime}
              onChangeText={setStartTime}
              editable={!isLocked}
              placeholder="Mulai"
              style={[styles.input, styles.boldText, isLocked && styles.textDisabled]}
            />
          </View>
          <Text style={styles.dash}>-</Text>
          <View style={[styles.inputContainer, { flex: 1 }, isLocked && styles.disabledInput]}>
            <Ionicons name="time-outline" size={20} color={isLocked ? '#AAA' : '#8D6E63'} style={styles.icon} />
            <TextInput
              value={endTime}
              onChangeText={setEndTime}
              editable={!isLocked}
              placeholder="Selesai"
              style={[styles.input, styles.boldText, isLocked && styles.textDisabled]}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Detail & Berkas</Text>

        <View style={styles.inputContainerMultiline}>
          <MaterialIcons name="note-add" size={20} color="#8D6E63" style={styles.iconMultiline} />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tulis deskripsi atau detail event di sini..."
            placeholderTextColor="#8D6E63"
            style={[styles.input, styles.boldText, styles.descriptionInput]}
            multiline
          />
        </View>

        {selectedFiles.map((file, index) => (
          <View key={index} style={styles.fileItemCard}>
            <Ionicons name="document-text" size={24} color="#FF8C00" />
            <Text style={styles.fileItemName} numberOfLines={1}>{file.name}</Text>
            <TouchableOpacity onPress={() => removeFile(index)}>
              <Ionicons name="close-circle" size={22} color="#E53935" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.uploadArea} onPress={handlePickDocument} activeOpacity={0.8}>
          <MaterialIcons name="drive-folder-upload" size={24} color="#8D6E63" />
          <Text style={styles.uploadText}>Tambah Berkas</Text>
        </TouchableOpacity>

        <Text style={styles.fileCriteria}>Kriteria file: PKS_NamaEvent, Invoice_NamaEvent</Text>

        <TouchableOpacity style={styles.btnSimpan} onPress={validateAndSave} activeOpacity={0.8}>
          <Text style={styles.btnText}>
            {isLocked ? 'Simpan Kelengkapan' : 'Simpan Perubahan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF2DB' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 10 },
  backButton: { backgroundColor: '#FF9800', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#4E342E', marginRight: 40 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#8D6E63', marginBottom: 10, marginTop: 10 },
  lockBanner: { flexDirection: 'row', backgroundColor: '#E8F5E9', padding: 12, borderRadius: 10, marginBottom: 15, alignItems: 'center' },
  lockText: { flex: 1, marginLeft: 8, fontSize: 11, color: '#2E7D32', fontWeight: '500' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 12, elevation: 2 },
  inputContainerMultiline: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 15, minHeight: 100, marginBottom: 12, elevation: 2, paddingTop: 10 },
  disabledInput: { backgroundColor: '#F5F5F5', elevation: 0, borderWidth: 1, borderColor: '#EEE' },
  textDisabled: { color: '#AAA' },
  icon: { marginRight: 10 },
  iconMultiline: { marginRight: 10, marginTop: 5 },
  input: { flex: 1, fontSize: 14, color: '#4E342E' },
  boldText: { fontWeight: 'bold' },
  descriptionInput: { flex: 1, textAlignVertical: 'top' },
  fileItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#FF8C00', elevation: 2 },
  fileItemName: { flex: 1, marginLeft: 10, fontSize: 13, color: '#4E342E', fontWeight: '600' },
  uploadArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderRadius: 12, height: 50, borderWidth: 1, borderColor: '#8D6E63', borderStyle: 'dashed', marginTop: 5 },
  uploadText: { marginLeft: 10, color: '#8D6E63', fontWeight: 'bold' },
  fileCriteria: { color: '#5C2C00', fontSize: 11, marginTop: 8, marginBottom: 20, textAlign: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dash: { fontSize: 20, fontWeight: 'bold', color: '#4E342E', marginBottom: 10 },
  btnSimpan: { backgroundColor: '#FF8C00', height: 55, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 5 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});