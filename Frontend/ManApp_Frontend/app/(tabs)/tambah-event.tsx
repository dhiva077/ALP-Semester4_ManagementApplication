import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { createEvent } from '../../src/services/eventService';
import { uploadEventPdf } from '../../src/services/fileApi';

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const YEARS = Array.from({ length: 31 }, (_, i) => 2020 + i);

const LOCATION_OPTIONS = [
  'Dian Auditorium UC Makassar Lt7',
  'Lapangan Basket UC Makassar',
  'Classroom A606',
  'Classroom A508',
];

interface SelectedFile {
  name: string;
  uri: string;
}

export default function TambahEvent() {
  const router = useRouter();
  
  // Form States
  const [picName, setPicName] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00');
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal States
  const [showDateModal, setShowDateModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempStartHour, setTempStartHour] = useState(0);
  const [tempStartMinute, setTempStartMinute] = useState(0);
  const [tempEndHour, setTempEndHour] = useState(0);
  const [tempEndMinute, setTempEndMinute] = useState(0);

  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const resetForm = () => {
    setPicName(currentUser?.name || '');
    setEventName('');
    setEventDate('');
    setLocation('');
    setStartTime('00:00');
    setEndTime('00:00');
    setDescription('');
    setSelectedFiles([]);
    setCalendarDate(new Date());
  };

  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        try {
          const savedUser = await AsyncStorage.getItem('user');
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            setCurrentUser(parsed);
            setPicName(parsed?.name || '');
          }
        } catch (error) {
          console.error('Failed to load user:', error);
        }
      };

      loadUser();
    }, [])
  );

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf", multiple: true });
      if (!result.canceled) {
        const newFiles = result.assets.map(asset => ({ name: asset.name, uri: asset.uri }));
        setSelectedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (err) { Alert.alert('Error', 'Gagal mengambil file.'); }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmPicker = () => {
    setCalendarDate(new Date(tempYear, tempMonth, 1));
    setShowPicker(false);
  };

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

  const isEarlierThan = (a: { hour: number; minute: number }, b: { hour: number; minute: number }) => {
    if (a.hour !== b.hour) return a.hour < b.hour;
    return a.minute < b.minute;
  };

  const combineDateTime = (date: string, time: string) => {
    return `${date} ${time}:00`;
  };

  const validateAndSave = async () => {
    if (!picName || !eventName || !location || !startTime || !endTime || !eventDate) {
      Alert.alert('Perhatian', 'Mohon lengkapi kolom wajib.');
      return;
    }

    if (!currentUser?.id) {
      Alert.alert('Perhatian', 'User belum terautentikasi. Silakan login ulang.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        user_id: currentUser.id,
        name: eventName,
        description: description || null,
        start_time: combineDateTime(eventDate, startTime),
        end_time: combineDateTime(eventDate, endTime),
        location,
        status_id: 1,
      };

      const response = await createEvent(payload);
      const createdEvent = response?.event || response;

      if (!createdEvent?.id) {
        throw new Error('Event gagal dibuat.');
      }

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          await uploadEventPdf(createdEvent.id, file.uri, file.name);
        }
      }

      Alert.alert('Sukses', 'Event berhasil ditambahkan.', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            router.replace('/(tabs)/dashboard');
          },
        },
      ]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Terjadi masalah penyimpanan.';
      Alert.alert('Gagal', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const shiftFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let days = [];
    for (let i = 0; i < shiftFirstDay; i++) days.push(<View key={`empty-${i}`} style={styles.dateCell} />);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = eventDate === dateStr;
      const isToday = dateStr === todayStr;
      days.push(
        <TouchableOpacity 
          key={d} 
          style={[styles.dateCell, isSelected && styles.selectedDateCell, isToday && styles.todayDateCell]} 
          onPress={() => { 
            setEventDate(dateStr); 
            setShowDateModal(false); 
          }}
        >
          <Text style={[styles.dateText, isSelected && styles.selectedDateText, isToday && styles.todayDateText]}>{d}</Text>
        </TouchableOpacity>
      );
    }
    return days;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/dashboard')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Event</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Informasi Utama</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="people-outline" size={20} color="#8D6E63" style={styles.icon} />
          <TextInput
            value={picName}
            onChangeText={setPicName}
            editable={false}
            placeholder="Nama PIC Event"
            style={[styles.input, styles.boldText, styles.disabledInputText]}
            placeholderTextColor="#A1887F"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="person-add-outline" size={20} color="#8D6E63" style={styles.icon} />
          <TextInput value={eventName} onChangeText={setEventName} placeholder="Nama Event" style={[styles.input, styles.boldText]} placeholderTextColor="#A1887F" />
        </View>
        
        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDateModal(true)}>
          <Ionicons name="calendar-outline" size={20} color="#8D6E63" style={styles.icon} />
          <Text style={[styles.input, styles.boldText, !eventDate && styles.placeholderText]}>{eventDate || 'Pilih Tanggal Event'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowLocationModal(true)}>
          <Ionicons name="location-outline" size={20} color="#8D6E63" style={styles.icon} />
          <Text style={[styles.input, styles.boldText, !location && styles.placeholderText]}>{location || 'Pilih Lokasi Event'}</Text>
        </TouchableOpacity>

        <View style={styles.timeRow}>
          <TouchableOpacity
            style={[styles.inputContainer, { flex: 1 }]}
            onPress={() => {
              const { hour, minute } = startTime ? parseTimeParts(startTime) : { hour: 0, minute: 0 };
              setTempStartHour(hour);
              setTempStartMinute(minute);
              setShowStartTimePicker(true);
            }}
          >
            <Ionicons name="time-outline" size={20} color="#8D6E63" style={styles.icon} />
            <Text style={[styles.input, styles.boldText, startTime === '00:00' && styles.placeholderText]}>
              {startTime}
            </Text>
          </TouchableOpacity>
          <Text style={styles.dash}>-</Text>
          <TouchableOpacity
            style={[styles.inputContainer, { flex: 1 }]}
            onPress={() => {
              const startParts = parseTimeParts(startTime || '00:00');
              const endParts = endTime ? parseTimeParts(endTime) : startParts;
              const safeHour = Math.max(endParts.hour, startParts.hour);
              const safeMinute = safeHour === startParts.hour ? Math.max(endParts.minute, startParts.minute) : endParts.minute;
              setTempEndHour(safeHour);
              setTempEndMinute(safeMinute);
              setShowEndTimePicker(true);
            }}
          >
            <Ionicons name="time-outline" size={20} color="#8D6E63" style={styles.icon} />
            <Text style={[styles.input, styles.boldText, endTime === '00:00' && styles.placeholderText]}>
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

        <TouchableOpacity style={styles.uploadArea} onPress={handlePickDocument}>
          <MaterialIcons name="drive-folder-upload" size={24} color="#8D6E63" />
          <Text style={styles.uploadText}>Tambah Berkas</Text>
        </TouchableOpacity>

        {/* File criteria text removed as requested */}

        <TouchableOpacity style={[styles.btnSimpan, isSubmitting && { opacity: 0.6 }]} onPress={validateAndSave} disabled={isSubmitting}>
          <Text style={styles.btnText}>Simpan Event</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- MODALS AREA --- */}
      <Modal visible={showDateModal} transparent animationType="fade" onRequestClose={() => setShowDateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dropdownBtn} 
                onPress={() => { 
                  setTempMonth(calendarDate.getMonth()); 
                  setTempYear(calendarDate.getFullYear()); 
                  setShowPicker(true); 
                }}
              >
                <Text style={styles.calendarTitle}>{MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}</Text>
                <Ionicons name="caret-down" size={14} color="#fff" style={{ marginLeft: 5 }} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarBody}>
              <View style={styles.weekRow}>{['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, i) => <Text key={i} style={styles.dayLabel}>{day}</Text>)}</View>
              <View style={styles.dateGrid}>{renderCalendarDays()}</View>
            </View>

            <TouchableOpacity onPress={() => setShowDateModal(false)} style={styles.closeBtn}>
              <Text style={{ color: '#FF8C00', fontWeight: 'bold' }}>Tutup</Text>
            </TouchableOpacity>
          </View>

          <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
            <View style={styles.pickerOverlay}>
              <View style={styles.modernPickerCard}>
                <View style={styles.pickerHeaderIndicator} />
                <Text style={styles.pickerModalTitle}>Pilih Periode</Text>
                
                <View style={styles.pickerContentRow}>
                  <View style={styles.pickerCol}>
                    <Text style={styles.colLabel}>Bulan</Text>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
                      {MONTHS.map((m, idx) => (
                        <TouchableOpacity 
                          key={m} 
                          style={[styles.modernPickerItem, tempMonth === idx && styles.modernActiveItem]} 
                          onPress={() => setTempMonth(idx)}
                        >
                          <Text style={[styles.modernPickerText, tempMonth === idx && styles.modernActiveText]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.pickerDivider} />
                  <View style={styles.pickerCol}>
                    <Text style={styles.colLabel}>Tahun</Text>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
                      {YEARS.map((y) => (
                        <TouchableOpacity 
                          key={y} 
                          style={[styles.modernPickerItem, tempYear === y && styles.modernActiveItem]} 
                          onPress={() => setTempYear(y)}
                        >
                          <Text style={[styles.modernPickerText, tempYear === y && styles.modernActiveText]}>{y}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.pickerActionRow}>
                  <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowPicker(false)}>
                    <Text style={styles.btnSecondaryText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPrimary} onPress={handleConfirmPicker}>
                    <Text style={styles.btnPrimaryText}>Terapkan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </Modal>

      <Modal visible={showLocationModal} transparent animationType="fade" onRequestClose={() => setShowLocationModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.locationModal}>
            <Text style={{fontSize: 18, fontWeight: 'bold', color: '#4E342E', marginBottom: 15}}>Pilih Lokasi</Text>
            {LOCATION_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt} style={styles.optionItem} onPress={() => { setLocation(opt); setShowLocationModal(false); }}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowLocationModal(false)} style={{marginTop: 15, alignSelf: 'center'}}><Text style={{color: '#FF8C00', fontWeight: 'bold'}}>Batal</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                  const nextStart = { hour: tempStartHour, minute: tempStartMinute };
                  setStartTime(formatTimeParts(nextStart.hour, nextStart.minute));

                  const currentEnd = parseTimeParts(endTime || '00:00');
                  if (isEarlierThan(currentEnd, nextStart)) {
                    setEndTime(formatTimeParts(nextStart.hour, nextStart.minute));
                  }
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
                  const startParts = parseTimeParts(startTime || '00:00');
                  if (index < startParts.hour) return null;
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
                  const startParts = parseTimeParts(startTime || '00:00');
                  if (tempEndHour === startParts.hour && index < startParts.minute) return null;
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 30 : 10,
    marginBottom: 10,
  },

  backButton: {
    backgroundColor: '#FF9800',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4E342E',
    marginRight: 40,
  },

  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 40,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8D6E63',
    marginBottom: 10,
    marginTop: 15,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 12,
    elevation: 2,
  },

  inputContainerMultiline: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    minHeight: 100,
    marginBottom: 12,
    elevation: 2,
    paddingTop: 10,
  },

  icon: {
    marginRight: 10,
  },

  iconMultiline: {
    marginRight: 10,
    marginTop: 5,
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

  disabledInputText: {
    color: '#8D6E63',
  },

  descriptionInput: {
    flex: 1,
    textAlignVertical: 'top',
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  dash: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4E342E',
    marginBottom: 10,
  },

  fileItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
    elevation: 2,
  },

  fileItemName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#4E342E',
    fontWeight: '600',
  },

  uploadArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    height: 50,
    borderWidth: 1,
    borderColor: '#8D6E63',
    borderStyle: 'dashed',
    marginTop: 5,
  },

  uploadText: {
    marginLeft: 10,
    color: '#8D6E63',
    fontWeight: 'bold',
  },

  fileCriteria: {
    color: '#5C2C00',
    fontSize: 11,
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
  },

  btnSimpan: {
    backgroundColor: '#FF8C00',
    height: 55,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 5,
  },

  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  calendarCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 20,
  },

  calendarHeader: {
    backgroundColor: '#FF8F29',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },

  calendarTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  calendarBody: {
    padding: 15,
  },

  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  dayLabel: {
    width: '14%',
    textAlign: 'center',
    color: '#5C2C00',
    fontWeight: 'bold',
  },

  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dateCell: {
    width: '14%',
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
  },

  dateText: {
    color: '#5C2C00',
  },

  selectedDateCell: {
    backgroundColor: '#FF8C00',
    borderRadius: 10,
  },

  todayDateCell: {
    borderWidth: 1,
    borderColor: '#FF8C00',
    borderRadius: 10,
  },

  selectedDateText: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  todayDateText: {
    fontWeight: 'bold',
  },

  closeBtn: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#EEE',
  },

  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modernPickerCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    paddingTop: 10,
    height: '60%',
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },

  pickerHeaderIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },

  pickerModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4E342E',
    textAlign: 'center',
    marginBottom: 20,
  },

  pickerContentRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  pickerCol: {
    flex: 1,
  },

  colLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A1887F',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },

  scrollPadding: {
    paddingBottom: 20,
  },

  pickerDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 10,
    height: '100%',
  },

  modernPickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 12,
  },

  modernActiveItem: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF8C00',
  },

  modernPickerText: {
    fontSize: 16,
    color: '#8D6E63',
    fontWeight: '500',
  },

  modernActiveText: {
    color: '#FF8C00',
    fontWeight: 'bold',
    fontSize: 18,
  },

  pickerActionRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },

  btnSecondary: {
    flex: 1,
    padding: 16,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },

  btnSecondaryText: {
    color: '#8D6E63',
    fontWeight: 'bold',
  },

  btnPrimary: {
    flex: 2,
    padding: 16,
    backgroundColor: '#FF8C00',
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
  },

  btnPrimaryText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  locationModal: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
  },

  optionItem: {
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },

  optionText: {
    color: '#4E342E',
    fontSize: 15,
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

  timePickerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
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
});