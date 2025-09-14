import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import Button from '../../../common/components/Button';
import { donaturSuratApi } from '../api/donaturSuratApi';

const SuratListScreen = () => {
  const nav = useNavigation();
  const { params } = useRoute();
  const { childId, childName } = params;
  
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    nav.setOptions({ title: `Pesan - ${childName}` });
  }, [nav, childName]);

  const fetchData = async () => {
    try {
      setError(null);
      const res = await donaturSuratApi.getSuratList(childId);
      setList(res.data.data);
    } catch (err) {
      console.error('Error:', err);
      setError('Gagal memuat pesan. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [childId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleView = (id) => {
    nav.navigate('SuratDetail', { 
      childId, 
      suratId: id, 
      childName,
      onGoBack: fetchData 
    });
  };

  const handleCompose = () => {
    nav.navigate('SuratForm', { 
      childId, 
      childName,
      onSuccess: fetchData 
    });
  };

  const markRead = async (id) => {
    try {
      await donaturSuratApi.markAsRead(childId, id);
      setList(prev => 
        prev.map(item => 
          item.id_surat === id ? { ...item, is_read: true } : item
        )
      );
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[s.card, !item.is_read && s.unread]}
      onPress={() => {
        handleView(item.id_surat);
        if (!item.is_read) markRead(item.id_surat);
      }}
    >
      <View style={s.header}>
        <View style={s.info}>
          <Text style={[s.date, !item.is_read && s.bold]}>
            {formatDate(item.tanggal)}
          </Text>
          {!item.is_read && (
            <View style={s.badge}>
              <Text style={s.badgeText}>BARU</Text>
            </View>
          )}
        </View>
        <Ionicons 
          name={item.foto ? "image" : "mail"} 
          size={20} 
          color={item.foto ? "#f39c12" : "#9b59b6"} 
        />
      </View>
      
      <Text style={[s.msg, !item.is_read && s.bold]} numberOfLines={3}>
        {item.pesan}
      </Text>
      
      <View style={s.footer}>
        {item.foto && (
          <View style={s.attach}>
            <Ionicons name="attach" size={16} color="#666" />
            <Text style={s.attachText}>Foto terlampir</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat pesan..." />;
  }

  return (
    <View style={s.container}>
      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      <View style={s.compose}>
        <Button
          title="Tulis Pesan"
          onPress={handleCompose}
          leftIcon={<Ionicons name="create" size={20} color="white" />}
          type="primary"
        />
      </View>

      {list.length > 0 ? (
        <FlatList
          data={list}
          renderItem={renderItem}
          keyExtractor={(item) => item.id_surat.toString()}
          contentContainerStyle={s.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={s.empty}>
          <Ionicons name="mail-outline" size={60} color="#ccc" />
          <Text style={s.emptyText}>Belum ada pesan</Text>
          <Text style={s.emptySub}>
            Mulai percakapan dengan admin panti tentang {childName}
          </Text>
          <Button
            title="Kirim Pesan Pertama"
            onPress={handleCompose}
            type="primary"
            style={s.firstBtn}
          />
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  compose: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  listContainer: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unread: { borderLeftWidth: 4, borderLeftColor: '#9b59b6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  info: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  date: { fontSize: 14, color: '#666', marginRight: 8 },
  bold: { fontWeight: '600', color: '#333' },
  badge: { backgroundColor: '#9b59b6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  msg: { fontSize: 16, color: '#333', lineHeight: 22, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attach: { flexDirection: 'row', alignItems: 'center' },
  attachText: { fontSize: 12, color: '#666', marginLeft: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#999', textAlign: 'center', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  firstBtn: { marginTop: 8 },
});

export default SuratListScreen;