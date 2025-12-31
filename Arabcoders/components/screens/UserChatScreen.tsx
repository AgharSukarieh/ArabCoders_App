import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as signalR from '@microsoft/signalr';
import { getUserMessagesWithAdmin, sendMessage, Message } from '@/services/messagesService';
import { useTheme } from '@/contexts/ThemeContext';
import { getStoredUser } from '@/services/storage';
import { useAppColors } from '@/hooks/use-app-colors';

interface UserChatScreenProps {
  adminId: number;
  adminName?: string;
  hubUrl?: string;
  onBack: () => void;
}

export function UserChatScreen({
  adminId,
  adminName = 'Admin',
  hubUrl = 'http://arabcodetest.runasp.net/chatHub',
  onBack,
}: UserChatScreenProps) {
  const { isDark } = useTheme();
  const colors = useAppColors();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);

  const currentUserIdRef = useRef<number | null>(null);

  /* ================= helpers ================= */

  const getTimestamp = (m: Message) =>
    m?.sentAt ?? m?.createdAt ?? new Date().toISOString();

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch {
      return '';
    }
  };

  /* ================= fetch messages (sort ONCE) ================= */

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const uid = currentUserIdRef.current;
      if (!uid) return;

      const data = await getUserMessagesWithAdmin(uid);

      const filtered = (data || []).filter(
        (m) =>
          (String(m.senderId) === String(uid) && String(m.receiverId) === String(adminId)) ||
          (String(m.senderId) === String(adminId) && String(m.receiverId) === String(uid))
      );

      // 🔥 الأحدث أولاً (مرة واحدة فقط)
      const sorted = filtered.sort(
        (a, b) =>
          new Date(getTimestamp(b)).getTime() -
          new Date(getTimestamp(a)).getTime()
      );

      setMessages(sorted);
    } catch {
      Alert.alert('خطأ', 'فشل تحميل الرسائل');
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  /* ================= load user ================= */

  useEffect(() => {
    (async () => {
      const user = await getStoredUser();
      const id =
        user?.responseUserDTO?.id ||
        user?.id ||
        user?.userId;

      if (id) {
        currentUserIdRef.current = Number(id);
        fetchMessages();
      }
    })();
  }, [fetchMessages]);

  /* ================= SignalR (NO SORT HERE) ================= */

  useEffect(() => {
    let hub: signalR.HubConnection | undefined;

    (async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      hub = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl!, { accessTokenFactory: () => token })
        .withAutomaticReconnect()
        .build();

      hub.on('ReceiveMessage', (msg: Message) => {
        const uid = String(currentUserIdRef.current);

        const isRelated =
          (String(msg.senderId) === uid && String(msg.receiverId) === String(adminId)) ||
          (String(msg.senderId) === String(adminId) && String(msg.receiverId) === uid);

        if (!isRelated) return;

        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(msg.id))) return prev;

          // 🔥 أضف الرسالة مباشرة بدون sort
          return [msg, ...prev];
        });
      });

      await hub.start();
    })();

    return () => {
      if (hub) {
        hub.stop().catch(() => {});
      }
    };
  }, [adminId, hubUrl]);

  /* ================= send ================= */

  const handleSend = async () => {
    if (!newText.trim()) return;

    const uid = currentUserIdRef.current;
    if (!uid) return;

    const now = new Date().toISOString();

    const optimistic: Message = {
      id: -Date.now(),
      message: newText,
      senderId: uid,
      receiverId: adminId,
      sentAt: now,
      createdAt: now,
      _optimistic: true,
    };

    // 🔥 أضفها بالأول
    setMessages((prev) => [optimistic, ...prev]);
    setNewText('');

    try {
      await sendMessage({
        message: optimistic.message,
        receiverId: adminId,
        images: [],
        videos: [],
      });
    } catch {
      setMessages((prev) => prev.filter((m) => !m._optimistic));
    }
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <View style={styles.titleContainer}>
          <Ionicons name="headset-outline" size={20} color={colors.primary} style={styles.titleIcon} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>{adminName}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => (item.id ?? Date.now()).toString()}
          contentContainerStyle={{ paddingVertical: 10 }}
          renderItem={({ item }) => {
            const fromMe = String(item.senderId) === String(currentUserIdRef.current);

            return (
              <View style={[styles.row, fromMe ? styles.me : styles.other]}>
                <View style={[
                  styles.bubble,
                  fromMe 
                    ? { backgroundColor: colors.primary } 
                    : { backgroundColor: isDark ? colors.cardBackground : colors.backgroundGray }
                ]}>
                  <Text style={[
                    styles.text,
                    fromMe 
                      ? { color: colors.white } 
                      : { color: colors.textPrimary }
                  ]}>
                    {item.message}
                  </Text>
                  <Text style={[
                    styles.time,
                    { color: fromMe ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary }
                  ]}>
                    {formatTime(getTimestamp(item))}
                  </Text>
                </View>
              </View>
            );
          }}
          refreshing={loading}
          onRefresh={fetchMessages}
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            value={newText}
            onChangeText={setNewText}
            placeholder="اكتب رسالة..."
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? colors.backgroundLight : colors.background,
                borderColor: colors.border,
                color: colors.textPrimary,
              }
            ]}
            multiline
          />
          <TouchableOpacity onPress={handleSend} style={[styles.send, { backgroundColor: colors.primary }]}>
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= styles ================= */

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    marginLeft: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  row: {
    marginHorizontal: 10,
    marginVertical: 4,
    flexDirection: 'row',
  },
  me: { justifyContent: 'flex-end' },
  other: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  text: {
    fontSize: 15,
  },
  time: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    maxHeight: 100,
  },
  send: {
    padding: 12,
    borderRadius: 20,
    marginLeft: 8,
  },
});
