import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DonaturCard = ({ 
  donatur, 
  onPress, 
  onEdit, 
  onDelete,
  style 
}) => {
  const getDiperuntukan = (value) => {
    const options = {
      'anak': 'Anak',
      'shelter': 'Shelter', 
      'kacab': 'Cabang'
    };
    return options[value] || value;
  };

  const getDiperuntukanbadgeColor = (value) => {
    const colors = {
      'anak': '#3498db',
      'shelter': '#2ecc71',
      'kacab': '#9b59b6'
    };
    return colors[value] || '#95a5a6';
  };

  return (
    <View style={[styles.card, style]}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => onPress?.(donatur)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {donatur.foto ? (
              <Image
                source={{ uri: `https://bp.berbagipendidikan.org/storage/Donatur/${donatur.id_donatur}/${donatur.foto}` }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{donatur.nama_lengkap}</Text>
            <Text style={styles.email}>{donatur.user?.email}</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.badge, { backgroundColor: getDiperuntukanbadgeColor(donatur.diperuntukan) }]}>
                <Text style={styles.badgeText}>{getDiperuntukan(donatur.diperuntukan)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{donatur.no_hp || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{donatur.wilbin?.nama_wilbin || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="home-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{donatur.shelter?.nama_shelter || '-'}</Text>
          </View>
          {donatur.anak && donatur.anak.length > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={16} color="#2ecc71" />
              <Text style={[styles.detailText, { color: '#2ecc71' }]}>
                {donatur.anak.length} anak binaan
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit?.(donatur)}
        >
          <Ionicons name="pencil" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete?.(donatur)}
        >
          <Ionicons name="trash" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#bdc3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#f39c12',
    borderBottomLeftRadius: 12,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    borderBottomRightRadius: 12,
  },
});

export default DonaturCard;