import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
  Modal,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchEvents } from '../../src/services/eventService';
import { fetchFiles } from '../../src/services/fileApi';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// PRESET MASKOT BARU SESUAI URL YANG DIBERIKAN
const AVATAR_PRESETS = [
  { id: '1', uri: 'https://i.pinimg.com/1200x/16/93/9d/16939d659f92b59f707bf54d409435eb.jpg' },
  { id: '2', uri: 'https://i.pinimg.com/736x/74/9f/51/749f511267c72fe6a8888d8ce3a3f13f.jpg' },
  { id: '3', uri: 'https://i.pinimg.com/736x/fd/25/c5/fd25c5d856325dfb2d9fbfca3bce5552.jpg' },
  { id: '4', uri: 'https://i.pinimg.com/736x/fe/92/e4/fe92e4668bacb3bd5bc14cc21ebc4196.jpg' },
  { id: '5', uri: 'https://i.pinimg.com/736x/f7/f8/04/f7f804e48d10beb6adb608fd92758995.jpg' },
  { id: '6', uri: 'https://i.pinimg.com/736x/28/ab/ac/28abac198c0b65c8b7cccf4de8a48700.jpg' },
];

export default function Profile() {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].uri);
  const [expandedHistory, setExpandedHistory] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ id?: number; name?: string; email?: string; role?: string } | null>(null);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);

  const PROFILE_IMAGE_KEY = 'USER_PROFILE_IMAGE'; 
  const DEFAULT_AVATAR = AVATAR_PRESETS[0].uri;

  useEffect(() => {
    const loadCurrentUserAndAvatar = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        const savedAvatar = await AsyncStorage.getItem(PROFILE_IMAGE_KEY);
        
        let loadedUser = null;
        if (savedUser) {
          loadedUser = JSON.parse(savedUser);
          setCurrentUser(loadedUser);
        }
        if (savedAvatar) {
          setSelectedAvatar(savedAvatar);
        } else {
          setSelectedAvatar(DEFAULT_AVATAR);
        }

        // Fetch events and files for history
        if (loadedUser?.id) {
          const [allEvents, allFiles] = await Promise.all([fetchEvents(), fetchFiles()]);
          const fileMap = new Map(
            allFiles.map((file: any) => [String(file.event_id), file])
          );
          const userEvents = allEvents.filter((ev: any) => ev.user_id === loadedUser.id);
          const mapped = userEvents.map((ev: any) => {
            const file = fileMap.get(String(ev.id));
            return {
              ...ev,
              _file: file || null,
            };
          });
          setHistoryEvents(mapped);
        }
      } catch (error) {
        console.error('Failed load profile data:', error);
      }
    };

    loadCurrentUserAndAvatar();
  }, []);

  const handleSelectAvatar = async (uri: string) => {
    try {
      await AsyncStorage.setItem(PROFILE_IMAGE_KEY, uri);
      setSelectedAvatar(uri);
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to save avatar:', error);
    }
  };

  const toggleHistory = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedHistory(!expandedHistory);
  };

  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar dari akun?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Keluar", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove(['isLoggedIn', 'authProvider', 'user']);
            router.replace('/login');
          }
        }
      ]
    );
  };

  // LOGIKA MENENTUKAN ROLE SECARA DINAMIS
  const getUserRole = () => {
    const userName = currentUser?.name ?? 'Rasya Dema';
    
    // Jika nama mengandung kata "Wulan" (case-insensitive), ubah role menjadi Job Evaluation
    if (userName.toLowerCase().includes('wulan')) {
      return 'Job Evaluation';
    }
    
    // Fallback default atau berdasarkan database role jika ada
    return currentUser?.role === 'manager' ? 'PIC Event' : 'PIC Event';
  };

  const toSnake = (value: string) => value.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

  const getHistoryStatus = (file: any) => {
    const statusKeys = [
      'statusFormChecklistSebelumAcara',
      'statusSuratPerjanjianKerjasama',
      'statusInvoice',
      'statusLembarDisposisi',
      'statusSuratIzinLoading',
      'statusFormChecklistSetelahAcara',
    ];
    const docKeys = [
      'form_checklist_sebelum_acara',
      'surat_perjanjian_kerjasama',
      'invoice',
      'lembar_disposisi',
      'surat_izin_loading',
      'form_checklist_setelah_acara',
    ];

    if (!file) {
      return { label: 'Belum', color: '#FF383C', badgeBg: '#FFE7E7' };
    }

    const statusCodes = statusKeys.map((key, index) => {
      const hasFile = !!file?.[docKeys[index]];
      if (!hasFile) return 'B';
      const resolved = file?.[key] ?? file?.[toSnake(key)];
      if (resolved?.code) return resolved.code;
      return 'S';
    });

    const allSelesai = statusCodes.every(code => code === 'S');
    const allBelum = statusCodes.every(code => code === 'B');
    const anyRevisi = statusCodes.some(code => code === 'R');

    if (allBelum) return { label: 'Belum', color: '#FF383C', badgeBg: '#FFE7E7' };
    if (allSelesai) return { label: 'Selesai', color: '#606C38', badgeBg: '#E8F5E9' };
    if (anyRevisi) return { label: 'Revisi', color: '#EA9B03', badgeBg: '#FFF3E0' };
    return { label: 'Proses', color: '#EA9B03', badgeBg: '#FFF3E0' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEF2DB" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Profile Card Utama */}
        <View style={styles.profileMainCard}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: selectedAvatar }} style={styles.avatar} />
            <TouchableOpacity 
              style={styles.editBadge} 
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="face-recognition" size={16} color="#FFFDF0" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfoText}>
            <Text style={styles.userName}>{currentUser?.name ?? 'Rasya Dema'}</Text>
            {currentUser?.email ? <Text style={styles.userEmail}>{currentUser.email}</Text> : null}
            <View style={styles.badgeRow}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#5C2C00" />
              {/* Memanggil fungsi penentu role dinamis */}
              <Text style={styles.userRole}>{getUserRole()}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Aktivitas</Text>
        
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity 
            activeOpacity={0.9}
            style={[styles.actionMenuCard, expandedHistory && styles.menuOpened]} 
            onPress={toggleHistory}
          >
            <View style={styles.menuIconCircle}>
              <Feather name="clock" size={20} color="#5C2C00" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuLabel}>Riwayat Event Saya</Text>
              <Text style={styles.menuSubLabel}>Lihat daftar event yang telah selesai</Text>
            </View>
            <Ionicons 
                name={expandedHistory ? "chevron-down" : "chevron-forward"} 
                size={20} 
                color="#5C2C00" 
            />
          </TouchableOpacity>

          {expandedHistory && (
            <View style={styles.dropdownContent}>
              {historyEvents.length > 0 ? (
                historyEvents.map((event, index) => {
                  const eventDate = new Date(event.start_time).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  });
                  const status = getHistoryStatus(event._file);
                  return (
                    <View key={event.id || index} style={[styles.eventItem, index > 0 && { marginTop: 15 }]}>
                      <View style={[styles.eventDot, { backgroundColor: status.color }]} />
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventName}>{event.name}</Text>
                        <Text style={styles.eventDate}>{eventDate} • PIC Event</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: status.badgeBg }]}
                      >
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={{ textAlign: 'center', color: '#888', marginTop: 10 }}>Belum ada riwayat event.</Text>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutFullButton} onPress={handleLogout}>
          <Feather name="log-out" size={20} color="#FFFDF0" />
          <Text style={styles.logoutFullText}>Keluar dari Akun</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Maskot</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#5C2C00" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={AVATAR_PRESETS}
              numColumns={3}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.avatarOption, selectedAvatar === item.uri && styles.avatarOptionSelected]}
                  onPress={() => handleSelectAvatar(item.uri)}
                >
                  <Image source={{ uri: item.uri }} style={styles.presetImage} />
                </TouchableOpacity>
              )}
            />
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
  scrollContainer: {
    paddingHorizontal: 25,
    paddingBottom: 50,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: '#FF8F29',
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
    color: '#5C2C00',
  },
  profileMainCard: {
    backgroundColor: '#FFFDF0',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#5C2C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#FFF5EB',
    marginTop: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#5C2C00',
    backgroundColor: '#5C2C00',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#FF8F29',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userInfoText: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#5C2C00',
  },
  userEmail: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#FEF2DB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userRole: {
    fontSize: 13,
    color: '#5C2C00',
    marginLeft: 6,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5C2C00',
    marginBottom: 12,
    marginLeft: 5,
  },
  dropdownWrapper: {
    marginBottom: 30,
  },
  actionMenuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF0',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#5C2C00',
    elevation: 2,
  },
  menuOpened: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  menuIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5C2C00',
  },
  menuSubLabel: {
    fontSize: 11,
    color: '#5C2C00',
    marginTop: 2,
  },
  dropdownContent: {
    backgroundColor: '#FFFDF0',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: '#5C2C00',
    borderTopWidth: 0,
    elevation: 2,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#606C38',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4E342E',
  },
  eventDate: {
    fontSize: 11,
    color: '#5C2C00',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#606C38',
  },
  logoutFullButton: {
    backgroundColor: '#FF383C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#FF383C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  logoutFullText: {
    color: '#FFFDF0',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 25,
    maxHeight: '60%',
  },
  modalDragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4E342E',
  },
  avatarOption: {
    flex: 1,
    alignItems: 'center',
    padding: 5,
    margin: 5,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },
  avatarOptionSelected: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF9F2',
  },
  presetImage: {
    width: width * 0.18,
    height: width * 0.18,
    borderRadius: 40,
  },
});