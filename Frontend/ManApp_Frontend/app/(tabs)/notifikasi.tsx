import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const STORAGE_KEY = 'MANAPP_EVENTS';
const CHECKLIST_KEY = 'CHECKLIST_DATA';
const DEFAULT_STATUS = ['belum', 'belum', 'belum', 'belum', 'belum', 'belum'];

interface NotificationItem {
  id: number;
  eventName: string;
  eventDate: string;
  incompleteCount: number;
  desc: string;
}

export default function Notifikasi() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = async () => {
    try {
      const savedEvents = await AsyncStorage.getItem(STORAGE_KEY);
      const savedChecklists = await AsyncStorage.getItem(CHECKLIST_KEY);
      
      const events = savedEvents ? JSON.parse(savedEvents) : {};
      const checklistData = savedChecklists ? JSON.parse(savedChecklists) : {};

      const list: NotificationItem[] = [];

      Object.entries(events).forEach(([date, items]) => {
        const eventList = items as any[];
        
        eventList.forEach((item) => {
          const statusArray = checklistData[item.title] || DEFAULT_STATUS;
          
          const incompleteCount = statusArray.filter((status: string) => status !== 'selesai').length;

          if (incompleteCount > 0) {
            list.push({
              id: item.id,
              eventName: item.title,
              eventDate: date,
              incompleteCount,
              desc: `Peringatan! Ayo buruan dicek, masih ada ${incompleteCount} file yang masih perlu diperhatikan`,
            });
          }
        });
      });

      setNotifications(list.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()));
    } catch (error) {
      console.error("Gagal memuat notifikasi:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push('/(tabs)/dashboard')}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {notifications.length > 0 ? (
          notifications.map((item, index) => (
            <TouchableOpacity
              key={`${item.eventName}-${index}`}
              style={styles.notifCard}
              activeOpacity={0.8}
              onPress={() => router.push({
                pathname: '/(tabs)/notifikasi-detail',
                params: {
                  eventName: item.eventName,
                  eventDate: item.eventDate,
                },
              })}
            >

              <View style={styles.iconContainer}>
                <Ionicons name="folder" size={38} color="#5D4037" />
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.notifTitle}>{item.eventName}</Text>
                <Text style={styles.notifDesc} numberOfLines={2}>
                  {item.desc}
                </Text>
              </View>

              <View style={styles.orangeBadge}>
                <Text style={styles.badgeText}>{item.incompleteCount}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#D7CCC8" />
            <Text style={styles.emptyText}>Semua file sudah lengkap!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2E3C9',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },

  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FF8C2B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D4037',
  },

  spacer: {
    width: 45,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    marginBottom: 15,
    borderRadius: 20,
    backgroundColor: '#FFFBF2',
    elevation: 3,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  iconContainer: {
    marginRight: 15,
  },

  textContainer: {
    flex: 1,
    marginRight: 10,
  },

  notifTitle: {
    marginBottom: 4,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D4037',
  },

  notifDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#7A5C46',
  },

  orangeBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF8C2B',
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },

  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
    opacity: 0.5,
  },

  emptyText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
    color: '#5D4037',
  },
});