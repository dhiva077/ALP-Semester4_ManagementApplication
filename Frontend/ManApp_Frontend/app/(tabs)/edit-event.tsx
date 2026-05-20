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
  Modal,
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
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00');
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempStartHour, setTempStartHour] = useState(0);
  const [tempStartMinute, setTempStartMinute] = useState(0);
  const [tempEndHour, setTempEndHour] = useState(0);
  const [tempEndMinute, setTempEndMinute] = useState(0);

  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [originalEventId, setOriginalEventId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  const STORAGE_KEY = 'MANAPP_EVENTS';

  const formatTimeParts = (hour: number, minute: number) => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const parseTimeParts = (value: string) => {
    const [hourStr, minuteStr] = value.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    return {
      hour: Number.isNaN(hour) ? 0 : hour,
      minute: Number.isNaN(minute) ? 0 : minute,
    };
  };

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

  const isValidTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

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
          setStartTime(start || '00:00');
          setEndTime(end || '00:00');
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
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      Alert.alert('Perhatian', 'Format jam harus 00:00.');
      return;
    }
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
          <TouchableOpacity
            style={[styles.inputContainer, { flex: 1 }, isLocked && styles.disabledInput]}
            disabled={isLocked}
            onPress={() => {
              const { hour, minute } = startTime ? parseTimeParts(startTime) : { hour: 0, minute: 0 };
              setTempStartHour(hour);
              setTempStartMinute(minute);
              setShowStartTimePicker(true);
            }}
          >
            <Ionicons name="time-outline" size={20} color={isLocked ? '#AAA' : '#8D6E63'} style={styles.icon} />
            <Text
              style={[
                styles.input,
                styles.boldText,
                startTime === '00:00' && styles.placeholderText,
                isLocked && styles.textDisabled,
              ]}
            >
              {startTime}
            </Text>
          </TouchableOpacity>
          <Text style={styles.dash}>-</Text>
          <TouchableOpacity
            style={[styles.inputContainer, { flex: 1 }, isLocked && styles.disabledInput]}
            disabled={isLocked}
            onPress={() => {
              const { hour, minute } = endTime ? parseTimeParts(endTime) : { hour: 0, minute: 0 };
              setTempEndHour(hour);
              setTempEndMinute(minute);
              setShowEndTimePicker(true);
            }}
          >
            <Ionicons name="time-outline" size={20} color={isLocked ? '#AAA' : '#8D6E63'} style={styles.icon} />
            <Text
              style={[
                styles.input,
                styles.boldText,
                endTime === '00:00' && styles.placeholderText,
                isLocked && styles.textDisabled,
              ]}
            >
              {endTime}
            </Text>
          </TouchableOpacity>
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

        {/* Baris teks kriteria file di sini telah dihilangkan */}

        <TouchableOpacity style={styles.btnSimpan} onPress={validateAndSave} activeOpacity={0.8}>
          <Text style={styles.btnText}>
            {isLocked ? 'Simpan Kelengkapan' : 'Simpan Perubahan'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showStartTimePicker} transparent animationType="fade" onRequestClose={() => setShowStartTimePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerCard}>
            <Text style={styles.timePickerTitle}>Pilih Jam Mulai</Text>
            <View style={styles.timePickerListRow}>
              <ScrollView style={styles.timePickerColumn} showsVerticalScrollIndicator={false}>
                {HOURS.map((hour, index) => {
                  const isActive = index === tempStartHour;
                  return (
                    <TouchableOpacity
                      key={hour}
                      style={[styles.timePickerItem, isActive && styles.timePickerItemActive]}
                      onPress={() => setTempStartHour(index)}
                    >
                      <Text style={[styles.timePickerItemText, isActive && styles.timePickerItemTextActive]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <ScrollView style={styles.timePickerColumn} showsVerticalScrollIndicator={false}>
                {MINUTES.map((minute, index) => {
                  const isActive = index === tempStartMinute;
                  return (
                    <TouchableOpacity
                      key={minute}
                      style={[styles.timePickerItem, isActive && styles.timePickerItemActive]}
                      onPress={() => setTempStartMinute(index)}
                    >
                      <Text style={[styles.timePickerItemText, isActive && styles.timePickerItemTextActive]}>
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <View style={styles.timePickerActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowStartTimePicker(false)}>
                <Text style={styles.btnSecondaryText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => {
                  setShowStartTimePicker(false);
                  setStartTime(formatTimeParts(tempStartHour, tempStartMinute));
                }}
              >
                <Text style={styles.btnPrimaryText}>Pilih</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEndTimePicker} transparent animationType="fade" onRequestClose={() => setShowEndTimePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerCard}>
            <Text style={styles.timePickerTitle}>Pilih Jam Selesai</Text>
            <View style={styles.timePickerListRow}>
              <ScrollView style={styles.timePickerColumn} showsVerticalScrollIndicator={false}>
                {HOURS.map((hour, index) => {
                  const isActive = index === tempEndHour;
                  return (
                    <TouchableOpacity
                      key={hour}
                      style={[styles.timePickerItem, isActive && styles.timePickerItemActive]}
                      onPress={() => setTempEndHour(index)}
                    >
                      <Text style={[styles.timePickerItemText, isActive && styles.timePickerItemTextActive]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <ScrollView style={styles.timePickerColumn} showsVerticalScrollIndicator={false}>
                {MINUTES.map((minute, index) => {
                  const isActive = index === tempEndMinute;
                  return (
                    <TouchableOpacity
                      key={minute}
                      style={[styles.timePickerItem, isActive && styles.timePickerItemActive]}
                      onPress={() => setTempEndMinute(index)}
                    >
                      <Text style={[styles.timePickerItemText, isActive && styles.timePickerItemTextActive]}>
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
            <View style={styles.timePickerActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowEndTimePicker(false)}>
                <Text style={styles.btnSecondaryText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => {
                  setShowEndTimePicker(false);
                  setEndTime(formatTimeParts(tempEndHour, tempEndMinute));
                }}
              >
                <Text style={styles.btnPrimaryText}>Pilih</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2DB',
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    elevation: 4,
  },

  headerTitle: {
    flex: 1,
    marginRight: 40,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4E342E',
  },

  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 40,
  },

  sectionLabel: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8D6E63',
  },

  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
  },

  lockText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 11,
    fontWeight: '500',
    color: '#2E7D32',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 15,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FFF',
    elevation: 2,
  },

  inputContainerMultiline: {
    flexDirection: 'row',
    minHeight: 100,
    paddingTop: 10,
    paddingHorizontal: 15,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FFF',
    elevation: 2,
  },

  disabledInput: {
    backgroundColor: '#F5F5F5',
    elevation: 0,
    borderWidth: 1,
    borderColor: '#EEE',
  },

  textDisabled: {
    color: '#AAA',
  },

  icon: {
    marginRight: 10,
  },

  iconMultiline: {
    marginTop: 5,
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: '#4E342E',
  },

  boldText: {
    fontWeight: 'bold',
  },

  placeholderText: {
    color: '#A1887F',
  },

  descriptionInput: {
    flex: 1,
    textAlignVertical: 'top',
  },

  fileItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
    elevation: 2,
  },

  fileItemName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#4E342E',
  },

  uploadArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    marginTop: 5,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#8D6E63',
    borderStyle: 'dashed',
  },

  uploadText: {
    marginLeft: 10,
    color: '#8D6E63',
    fontWeight: 'bold',
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  dash: {
    marginBottom: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4E342E',
  },

  btnSimpan: {
    height: 55,
    marginTop: 10,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF8C00',
    elevation: 5,
  },

  btnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  timePickerCard: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },

  timePickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4E342E',
    textAlign: 'center',
    marginBottom: 10,
  },

  timePickerListRow: {
    flexDirection: 'row',
    gap: 12,
    maxHeight: 220,
  },

  timePickerColumn: {
    flex: 1,
    backgroundColor: '#FDF5E6',
    borderRadius: 12,
    paddingVertical: 8,
  },

  timePickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
  },

  timePickerItemActive: {
    backgroundColor: '#FF8C00',
    marginHorizontal: 10,
    borderRadius: 10,
  },

  timePickerItemText: {
    color: '#5C2C00',
    fontWeight: '600',
  },

  timePickerItemTextActive: {
    color: '#FFF',
  },

  timePickerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },

  btnSecondary: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },

  btnSecondaryText: {
    color: '#8D6E63',
    fontWeight: 'bold',
  },

  btnPrimary: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FF8C00',
    alignItems: 'center',
  },

  btnPrimaryText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});