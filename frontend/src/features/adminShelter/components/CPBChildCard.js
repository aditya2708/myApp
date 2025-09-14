import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CPBChildCard = ({ child, onPress }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'BCPB':
        return '#e67e22';
      case 'CPB':
        return '#3498db';
      case 'NPB':
        return '#95a5a6';
      case 'PB':
        return '#27ae60';
      default:
        return '#9b59b6';
    }
  };

  const getGenderIcon = (gender) => {
    return gender === 'Laki-laki' ? 'male' : 'female';
  };

  const getGenderColor = (gender) => {
    return gender === 'Laki-laki' ? '#3498db' : '#e91e63';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(child)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Left side - Photo and basic info */}
        <View style={styles.leftSection}>
          <Image
            source={{ 
              uri: child.foto_url || 'https://via.placeholder.com/60x60?text=No+Photo' 
            }}
            style={styles.photo}
          />
          <View style={styles.basicInfo}>
            <Text style={styles.fullName} numberOfLines={2}>
              {child.full_name}
            </Text>
            {child.nick_name && (
              <Text style={styles.nickName} numberOfLines={1}>
                ({child.nick_name})
              </Text>
            )}
            <View style={styles.genderAge}>
              <Ionicons 
                name={getGenderIcon(child.jenis_kelamin)} 
                size={14} 
                color={getGenderColor(child.jenis_kelamin)} 
              />
              <Text style={styles.genderText}>
                {child.jenis_kelamin}
              </Text>
              {child.umur && (
                <Text style={styles.ageText}>
                  • {child.umur} thn
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Right section - Details and status */}
        <View style={styles.rightSection}>
          {/* Status CPB Badge */}
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(child.status_cpb) }
          ]}>
            <Text style={styles.statusText}>
              {child.status_cpb}
            </Text>
          </View>

          {/* Details */}
          <View style={styles.details}>
            {child.kelas && (
              <View style={styles.detailRow}>
                <Ionicons name="school" size={12} color="#666" />
                <Text style={styles.detailText}>
                  Kelas {child.kelas}
                  {child.level && ` - ${child.level}`}
                </Text>
              </View>
            )}
            
            {child.status_orang_tua && (
              <View style={styles.detailRow}>
                <Ionicons name="people" size={12} color="#666" />
                <Text style={styles.detailText}>
                  {child.status_orang_tua}
                </Text>
              </View>
            )}

            {child.sponsorship_date && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={12} color="#666" />
                <Text style={styles.detailText}>
                  Sponsor: {formatDate(child.sponsorship_date)}
                </Text>
              </View>
            )}

            {child.created_at && (
              <View style={styles.detailRow}>
                <Ionicons name="time" size={12} color="#666" />
                <Text style={styles.detailText}>
                  Daftar: {formatDate(child.created_at)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  leftSection: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 16
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    marginRight: 12
  },
  basicInfo: {
    flex: 1,
    justifyContent: 'center'
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  nickName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4
  },
  genderAge: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  genderText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  ageText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 120
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff'
  },
  details: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  detailText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    textAlign: 'right'
  }
});

export default CPBChildCard;