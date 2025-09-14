import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import TextInput from '../../../common/components/TextInput';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import TutorListItem from '../../../common/components/Tutor/TutorListItem';

// Import Redux actions and selectors
import {
  fetchTutors,
  deleteTutor,
  setSearchFilter,
  resetFilters,
  selectAllTutors,
  selectTutorStatus,
  selectTutorError,
  selectTutorPagination,
  selectTutorFilters
} from '../redux/tutorSlice';

// Get screen width for responsive design
const { width } = Dimensions.get('window');

const TutorManagementScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  // Selectors
  const tutors = useSelector(selectAllTutors);
  const status = useSelector(selectTutorStatus);
  const error = useSelector(selectTutorError);
  const { currentPage, totalPages, total } = useSelector(selectTutorPagination);
  const filters = useSelector(selectTutorFilters);

  // Local state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState(filters.search);

  // Fetch tutors
  const loadTutors = useCallback((page = 1, shouldRefresh = false) => {
    dispatch(fetchTutors({ 
      page, 
      search: searchText 
    }));
  }, [dispatch, searchText]);

  // Initial load
  useEffect(() => {
    loadTutors();
  }, [loadTutors]);

  // Handle search
  const handleSearch = () => {
    dispatch(setSearchFilter(searchText));
    loadTutors(1, true);
  };

  // Reset search
  const handleResetSearch = () => {
    setSearchText('');
    dispatch(resetFilters());
    loadTutors(1, true);
  };

  // Load more tutors
  const handleLoadMore = () => {
    if (status !== 'loading' && currentPage < totalPages) {
      setIsLoadingMore(true);
      loadTutors(currentPage + 1);
      setIsLoadingMore(false);
    }
  };

  // Delete tutor
  const handleDeleteTutor = (tutor) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus tutor ${tutor.nama}?`,
      [
        {
          text: 'Batal',
          style: 'cancel'
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteTutor(tutor.id_tutor))
              .unwrap()
              .then(() => {
                Alert.alert('Berhasil', 'Tutor berhasil dihapus');
              })
              .catch((error) => {
                Alert.alert('Gagal', error || 'Gagal menghapus tutor');
              });
          }
        }
      ]
    );
  };

  // Navigate to tutor form
  const navigateToTutorForm = (tutor = null) => {
    navigation.navigate('TutorForm', { 
      tutor: tutor 
    });
  };

  // Render tutor item
  const renderTutorItem = ({ item }) => (
    <TutorListItem
      tutor={item}
      onPress={() => navigation.navigate('TutorDetail', { tutorId: item.id_tutor })}
      onEdit={() => navigateToTutorForm(item)}
      onDelete={() => handleDeleteTutor(item)}
    />
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return <LoadingSpinner size="small" />;
  };

  // Render header with total count
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>Jumlah Tutor: {total}</Text>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="school-outline" size={64} color="#e0e0e0" />
      <Text style={styles.emptyTitle}>Tidak Ada Tutor</Text>
      <Text style={styles.emptySubtitle}>
        {status === 'failed' 
          ? 'Gagal memuat data tutor' 
          : 'Tambahkan tutor baru untuk memulai'}
      </Text>
      <TouchableOpacity 
        style={styles.addTutorButton}
        onPress={() => navigateToTutorForm()}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
        <Text style={styles.addTutorButtonText}>Tambah Tutor</Text>
      </TouchableOpacity>
    </View>
  );

  // Render loading state
  if (status === 'loading' && !isLoadingMore) {
    return <LoadingSpinner fullScreen message="Memuat daftar tutor..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter Section */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Cari tutor..."
            leftIcon={<Ionicons name="search" size={20} color="#666" />}
            rightIcon={
              searchText ? (
                <Ionicons 
                  name="close-circle" 
                  size={20} 
                  color="#666" 
                  onPress={handleResetSearch}
                />
              ) : null
            }
            style={styles.searchInput}
            onSubmitEditing={handleSearch}
            inputProps={{
              returnKeyType: 'search'
            }}
          />
        </View>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Cari</Text>
        </TouchableOpacity>
      </View>

      {/* Error Handling */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => loadTutors()}
        />
      )}

      {/* Tutor List */}
      <FlatList
        data={tutors}
        renderItem={renderTutorItem}
        keyExtractor={(item) => item.id_tutor.toString()}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={status === 'loading'}
            onRefresh={() => loadTutors(1, true)}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContentContainer}
      />

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.floatingAddButton}
        onPress={() => navigateToTutorForm()}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flex: 1,
    marginRight: 8,
  },
  searchInput: {
    width: '100%',
  },
  searchButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: width * 0.2,
    maxWidth: 100,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContentContainer: {
    paddingBottom: 80,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  addTutorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  addTutorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#3498db',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default TutorManagementScreen;