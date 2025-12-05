<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Kehadiran Anak Binaan - {{ $data['shelter'] }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.3;
            margin: 15px;
            color: #333;
        }
        
        .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 2px solid #333;
            padding-bottom: 12px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .header .subtitle {
            margin: 4px 0;
            font-size: 12px;
            color: #7f8c8d;
        }
        
        .info-section {
            margin-bottom: 15px;
            background: #f8f9fa;
            padding: 12px;
            border-radius: 4px;
            font-size: 10px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
        }
        
        .info-label {
            font-weight: bold;
            width: 40%;
        }
        
        .summary-section {
            margin-bottom: 20px;
        }
        
        .summary-title {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #2c3e50;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .summary-card {
            background: #fff;
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
            border-radius: 4px;
        }
        
        .summary-value {
            font-size: 14px;
            font-weight: bold;
            color: #9b59b6;
            margin-bottom: 3px;
        }
        
        .summary-label {
            font-size: 9px;
            color: #666;
        }
        
        .data-section {
            margin-top: 15px;
        }
        
        .section-title {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
            border-bottom: 1px solid #eee;
            padding-bottom: 4px;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 9px;
        }
        
        .data-table th,
        .data-table td {
            border: 1px solid #ddd;
            padding: 5px;
            text-align: center;
        }
        
        .data-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            color: #2c3e50;
            font-size: 8px;
        }
        
        .data-table .name-col {
            text-align: left;
            max-width: 120px;
            font-size: 8px;
        }
        
        .data-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .percentage-good { color: #27ae60; font-weight: bold; }
        .percentage-average { color: #f39c12; font-weight: bold; }
        .percentage-poor { color: #e74c3c; font-weight: bold; }
        
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 9px;
            color: #7f8c8d;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
        
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1>LAPORAN KEHADIRAN ANAK BINAAN</h1>
        <div class="subtitle">{{ $data['shelter'] }}</div>
        @if($data['shelter_coordinator'])
        <div class="subtitle">Koordinator: {{ $data['shelter_coordinator'] }}</div>
        @endif
    </div>

    <!-- Report Info -->
    <div class="info-section">
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Tanggal Export:</span>
                <span>{{ date('d/m/Y H:i', strtotime($data['export_date'])) }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Total Data:</span>
                <span>{{ $data['total_records'] }} anak</span>
            </div>
            <div class="info-item">
                <span class="info-label">Periode:</span>
                <span>{{ date('d/m/Y', strtotime($data['filters']['start_date'])) }} - {{ date('d/m/Y', strtotime($data['filters']['end_date'])) }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Jenis Kegiatan:</span>
                <span>{{ $data['filters']['jenis_kegiatan'] ?: 'Semua' }}</span>
            </div>
        </div>
    </div>

    <!-- Summary Section -->
    <div class="summary-section">
        <div class="summary-title">Ringkasan Kehadiran</div>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-value">{{ $data['summary']['total_children'] }}</div>
                <div class="summary-label">Total Anak</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">{{ $data['summary']['average_attendance'] }}%</div>
                <div class="summary-label">Rata-rata Kehadiran</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">{{ $data['summary']['total_activities'] }}</div>
                <div class="summary-label">Total Aktivitas</div>
            </div>
        </div>
    </div>

    <!-- Data Table -->
    <div class="data-section">
        <div class="section-title">Detail Kehadiran Anak Binaan</div>
        
        @if(count($data['children']) > 0)
        <table class="data-table">
            <thead>
                <tr>
                    <th rowspan="2" style="width: 3%;">No</th>
                    <th rowspan="2" style="width: 15%;">Nama Lengkap</th>
                    <th rowspan="2" style="width: 10%;">Panggilan</th>
                    @foreach($data['months'] as $month)
                    <th colspan="3" style="width: {{ 72 / count($data['months']) }}%;">{{ $month['name'] }}</th>
                    @endforeach
                    <th rowspan="2" style="width: 6%;">Total</th>
                    <th rowspan="2" style="width: 6%;">%</th>
                </tr>
                <tr>
                    @foreach($data['months'] as $month)
                    <th>Akt</th>
                    <th>Hdr</th>
                    <th>%</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($data['children'] as $index => $child)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td class="name-col">{{ $child['nama_lengkap'] }}</td>
                    <td class="name-col">{{ $child['nama_panggilan'] ?: '-' }}</td>
                    @foreach($child['monthly_data'] as $monthData)
                    <td>{{ $monthData['activities_count'] }}</td>
                    <td>{{ $monthData['attended_count'] }}</td>
                    <td class="
                        @if($monthData['percentage'] >= 80) percentage-good
                        @elseif($monthData['percentage'] >= 60) percentage-average
                        @else percentage-poor
                        @endif
                    ">{{ $monthData['percentage'] }}%</td>
                    @endforeach
                    <td><strong>{{ $child['total_attended'] }}/{{ $child['total_activities'] }}</strong></td>
                    <td class="
                        @if($child['overall_percentage'] >= 80) percentage-good
                        @elseif($child['overall_percentage'] >= 60) percentage-average
                        @else percentage-poor
                        @endif
                    "><strong>{{ $child['overall_percentage'] }}%</strong></td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div style="text-align: center; padding: 20px; color: #7f8c8d;">
            Tidak ada data untuk ditampilkan
        </div>
        @endif
    </div>

    <!-- Legend -->
    <div style="margin-top: 15px; font-size: 9px;">
        <strong>Keterangan:</strong>
        <span class="percentage-good">■ ≥80% (Sangat Baik)</span> |
        <span class="percentage-average">■ 60-79% (Baik)</span> |
        <span class="percentage-poor">■ <60% (Perlu Perhatian)</span>
        <br>
        <strong>Singkatan:</strong> Akt = Aktivitas, Hdr = Hadir, % = Persentase
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>Dokumen ini digenerate secara otomatis pada {{ date('d/m/Y H:i') }}</p>
        <p>Sistem Informasi Manajemen Shelter - {{ $data['shelter'] }}</p>
    </div>
</body>
</html>