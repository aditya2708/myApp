import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { formatDateToIndonesian } from '../../../../common/utils/dateFormatter';
import { formatEducationLevel, getParentStatusDescription } from '../../utils/keluargaFormUtils';

const KeluargaFormReview = ({ formData, dropdownData, isEditMode }) => {
  const findBankName = (id) => {
    const bank = dropdownData.bank.find(b => b.id_bank.toString() === id);
    return bank ? bank.nama_bank : '-';
  };

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderParentSection = (parent, data) => (
    <Section title={`Informasi ${parent}`}>
      <InfoRow label="Nama" value={data[`nama_${parent.toLowerCase()}`]} />
      <InfoRow label="NIK" value={data[`nik_${parent.toLowerCase()}`]} />
      <InfoRow label="Agama" value={data[`agama_${parent.toLowerCase()}`]} />
      <InfoRow 
        label="Tempat dan tanggal lahir" 
        value={data[`tempat_lahir_${parent.toLowerCase()}`] ? 
          `${data[`tempat_lahir_${parent.toLowerCase()}`]}, ${formatDateToIndonesian(data[`tanggal_lahir_${parent.toLowerCase()}`])}` : '-'
        } 
      />
      <InfoRow label="Alamat" value={data[`alamat_${parent.toLowerCase()}`]} />
      <InfoRow label="Penghasilan" value={data[`penghasilan_${parent.toLowerCase()}`]} />
      
      {data[`tanggal_kematian_${parent.toLowerCase()}`] && (
        <>
          <InfoRow label="Meninggal" value={formatDateToIndonesian(data[`tanggal_kematian_${parent.toLowerCase()}`])} />
          <InfoRow label="Penyebab" value={data[`penyebab_kematian_${parent.toLowerCase()}`]} />
        </>
      )}
    </Section>
  );

  const renderEducationFields = () => {
    if (!formData.jenjang) return null;
    
    const isSchool = ['sd', 'smp', 'sma'].includes(formData.jenjang);
    const isCollege = formData.jenjang === 'perguruan_tinggi';
    
    return (
      <>
        {isSchool && (
          <>
            <InfoRow label="Kelas" value={formData.kelas} />
            {formData.jenjang === 'sma' && <InfoRow label="Jurusan" value={formData.jurusan} />}
            <InfoRow label="Sekolah" value={formData.nama_sekolah} />
            <InfoRow label="Alamat" value={formData.alamat_sekolah} />
          </>
        )}
        
        {isCollege && (
          <>
            <InfoRow label="Semester" value={formData.semester} />
            <InfoRow label="Jurusan" value={formData.jurusan} />
            <InfoRow label="Perguruan Tinggi" value={formData.nama_pt} />
            <InfoRow label="Alamat" value={formData.alamat_pt} />
          </>
        )}
      </>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.reviewTitle}>
        Silakan tinjau semua informasi sebelum {isEditMode ? 'memperbarui' : 'menyimpan'}
      </Text>
      
      <Section title="Informasi Keluarga">
        <InfoRow label="Nomor KK" value={formData.no_kk} />
        <InfoRow label="Kepala Keluarga" value={formData.kepala_keluarga} />
        <InfoRow label="Status" value={getParentStatusDescription(formData.status_ortu)} />
        <InfoRow label="Bank" value={findBankName(formData.id_bank)} />
        <InfoRow 
          label="Rekening" 
          value={formData.no_rek ? `${formData.no_rek} (${formData.an_rek})` : '-'} 
        />
        <InfoRow 
          label="Telepon" 
          value={formData.no_tlp ? `${formData.no_tlp} (${formData.an_tlp})` : '-'} 
        />
      </Section>

      {renderParentSection('Ayah', formData)}
      {renderParentSection('Ibu', formData)}

      {(formData.nik_wali || formData.nama_wali) && (
        <Section title="Informasi Wali">
          <InfoRow label="NIK" value={formData.nik_wali} />
          <InfoRow label="Nama" value={formData.nama_wali} />
          <InfoRow label="Hubungan" value={formData.hub_kerabat_wali} />
          <InfoRow label="Agama" value={formData.agama_wali} />
          <InfoRow 
            label="Tempat dan tanggal lahir" 
            value={formData.tempat_lahir_wali ? 
              `${formData.tempat_lahir_wali}, ${formatDateToIndonesian(formData.tanggal_lahir_wali)}` : '-'
            } 
          />
          <InfoRow label="Alamat" value={formData.alamat_wali} />
          <InfoRow label="Penghasilan" value={formData.penghasilan_wali} />
        </Section>
      )}

      <Section title="Informasi Anak">
        <InfoRow label="NIK" value={formData.nik_anak} />
        <InfoRow label="Nama" value={`${formData.full_name} (${formData.nick_name})`} />
        <InfoRow 
          label="Kelahiran" 
          value={formData.tempat_lahir ? 
            `${formData.tempat_lahir}, ${formatDateToIndonesian(formData.tanggal_lahir)}` : '-'
          } 
        />
        <InfoRow label="Jenis Kelamin" value={formData.jenis_kelamin} />
        <InfoRow label="Agama" value={formData.agama} />
        <InfoRow 
          label="Anak Ke" 
          value={formData.anak_ke && formData.dari_bersaudara ? 
            `${formData.anak_ke} dari ${formData.dari_bersaudara}` : '-'
          } 
        />
        <InfoRow label="Tinggal Bersama" value={formData.tinggal_bersama} />
        <InfoRow label="Hafalan" value={formData.hafalan} />
        <InfoRow label="Hobi" value={formData.hobi} />
        <InfoRow label="Mata Pelajaran Favorit" value={formData.pelajaran_favorit} />
        <InfoRow label="Prestasi" value={formData.prestasi} />
        <InfoRow label="Jarak" value={formData.jarak_rumah ? `${formData.jarak_rumah} km` : '-'} />
        <InfoRow label="Transportasi" value={formData.transportasi} />
      </Section>

      <Section title="Informasi Pendidikan">
        <InfoRow label="Jenjang" value={formatEducationLevel(formData.jenjang)} />
        {renderEducationFields()}
      </Section>

      <Section title="Survei - Informasi Dasar">
        <InfoRow label="Pekerjaan Kepala Keluarga" value={formData.pekerjaan_kepala_keluarga} />
        <InfoRow label="Pendidikan Kepala Keluarga" value={formData.pendidikan_kepala_keluarga} />
        <InfoRow label="Jumlah Tanggungan" value={formData.jumlah_tanggungan} />
        <InfoRow label="Kepribadian Anak" value={formData.kepribadian_anak} />
        <InfoRow label="Kondisi Fisik Anak" value={formData.kondisi_fisik_anak} />
        {formData.kondisi_fisik_anak === 'Disabilitas' && (
          <InfoRow label="Keterangan Disabilitas" value={formData.keterangan_disabilitas} />
        )}
      </Section>

      <Section title="Survei - Informasi Keuangan">
        <InfoRow label="Penghasilan" value={formData.penghasilan} />
        <InfoRow label="Tabungan" value={formData.kepemilikan_tabungan} />
        <InfoRow 
          label="Biaya Pendidikan" 
          value={formData.biaya_pendidikan_perbulan ? `Rp ${formData.biaya_pendidikan_perbulan}` : '-'} 
        />
        <InfoRow label="Bantuan Lain" value={formData.bantuan_lembaga_formal_lain} />
        {formData.bantuan_lembaga_formal_lain === 'Ya' && (
          <InfoRow 
            label="Jumlah Bantuan" 
            value={formData.bantuan_lembaga_formal_lain_sebesar ? 
              `Rp ${formData.bantuan_lembaga_formal_lain_sebesar}` : '-'
            } 
          />
        )}
      </Section>

      <Section title="Survei - Informasi Aset">
        <InfoRow label="Kepemilikan Tanah" value={formData.kepemilikan_tanah} />
        <InfoRow label="Kepemilikan Rumah" value={formData.kepemilikan_rumah} />
        <InfoRow label="Kondisi Dinding" value={formData.kondisi_rumah_dinding} />
        <InfoRow label="Kondisi Lantai" value={formData.kondisi_rumah_lantai} />
        <InfoRow label="Kendaraan" value={formData.kepemilikan_kendaraan} />
        <InfoRow label="Elektronik" value={formData.kepemilikan_elektronik} />
      </Section>

      <Section title="Survei - Informasi Kesehatan">
        <InfoRow label="Jumlah Makan per Hari" value={formData.jumlah_makan} />
        <InfoRow label="Sumber Air Bersih" value={formData.sumber_air_bersih} />
        <InfoRow label="Jamban" value={formData.jamban_limbah} />
        <InfoRow label="Tempat Sampah" value={formData.tempat_sampah} />
        <InfoRow label="Perokok" value={formData.perokok} />
        <InfoRow label="Konsumen Minuman Keras" value={formData.konsumen_miras} />
        <InfoRow label="Kotak P3K" value={formData.persediaan_p3k} />
        <InfoRow label="Buah & Sayuran" value={formData.makan_buah_sayur} />
      </Section>

      <Section title="Survei - Keagamaan & Sosial">
        <InfoRow label="Sholat Lima Waktu" value={formData.solat_lima_waktu} />
        <InfoRow label="Membaca Al-Quran" value={formData.membaca_alquran} />
        <InfoRow label="Majelis Taklim" value={formData.majelis_taklim} />
        <InfoRow label="Membaca Berita" value={formData.membaca_koran} />
        <InfoRow label="Pengurus Organisasi" value={formData.pengurus_organisasi} />
        {formData.pengurus_organisasi === 'Ya' && (
          <InfoRow label="Jabatan" value={formData.pengurus_organisasi_sebagai} />
        )}
        <InfoRow label="Kondisi Penerima Manfaat" value={formData.kondisi_penerima_manfaat} />
      </Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 90,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
});

export default KeluargaFormReview;