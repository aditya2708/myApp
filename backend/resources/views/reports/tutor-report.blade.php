<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Kehadiran Tutor - {{ $data['shelter'] }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
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
            font-size: 13px;
            color: #7f8c8d;
        }
        
        .info-section {
            margin-bottom: 18px;
            background: #f8f9fa;
            padding: 12px;
            border-radius: 4px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }
        
        .info-label {
            font-weight: bold;
            width: 30%;
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
            grid-template-columns: repeat(5, 1fr);
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
            margin-bottom: 4px;
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
            margin-bottom: 12px;
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
            text-align: left;
        }
        
        .data-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            color: #2c3e50;
            font-size: 9px;
        }
        
        .data-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .percentage-high { 
            color: #27ae60; 
            font-weight: bold;
        }
        
        .percentage-medium { 
            color: #f39c12; 
            font-weight: bold;
        }
        
        .percentage-low { 
            color: #e74c3c; 
            font-weight: bold;
        }
        
        .monthly-data {
            font-size: 8px;
            background: #f8f9fa;
            padding: 4px;
            border-radius: 3px;
            margin: 2px 0;
        }
        
        .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 9px;
            color: #7f8c8d;
            border-top: 1px solid #eee;
            padding-top: 12px;
        }
        
        .page-break {
            page-break-before: always;
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
        <h1>LAPORAN KEHADIRAN TUTOR</h1>
        <div class="subtitle">{{ $data['shelter'] }}</div>
        @if($data['shelter_coordinator'])
        <div class="subtitle">Koordinator: {{ $data['shelter_coordinator'] }}</div>
        @endif
    </div>

    <!-- Report Info -->
    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Tanggal Export:</span>
            <span>{{ date('d/m/Y H:i', strtotime($data['export_date'])) }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Periode:</span>
            <span>{{ date('d/m/Y', strtotime($data['filters']['start_date'])) }} - {{ date('d/m/Y', strtotime($data['filters']['end_date'])) }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Jenis Kegiatan:</span>
            <span>{{ $data['filters']['jenis_kegiatan'] ?: 'Semua Jenis' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Total Data:</span>
            <span>{{ $data['total_records'] }} tutor</span>
        </div>
    </div>

    <!-- Summary Section -->
    <div class="summary-section">
        <div class="summary-title">Ringkasan Kehadiran Tutor</div>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-value">{{ $data['summary']['total_tutors'] }}</div>
                <div class="summary-label">Total Tutor</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">{{ $data['summary']['total_activities'] }}</div>
                <div class="summary-label">Total Aktivitas</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">{{ number_format($data['summary']['average_attendance'], 1) }}%</div>
                <div class="summary-label">Rata-rata</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">{{ number_format($data['summary']['highest_attendance'], 1) }}%</div>
                <div class="summary-label">Tertinggi</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">{{ number_format($data['summary']['lowest_attendance'], 1) }}%</div>
                <div class="summary-label">Terendah</div>
            </div>
        </div>
    </div>

    <!-- Data Table -->
    <div class="data-section">
        <div class="section-title">
            Daftar Kehadiran Tutor
            @if($data['filters']['jenis_kegiatan'])
                - {{ $data['filters']['jenis_kegiatan'] }}
            @endif
        </div>
        
        @if(count($data['tutors']) > 0)
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 4%;">No</th>
                    <th style="width: 20%;">Nama Tutor</th>
                    <th style="width: 15%;">Mata Pelajaran</th>
                    <th style="width: 8%;">Total Aktivitas</th>
                    <th style="width: 8%;">Total Hadir</th>
                    <th style="width: 8%;">Persentase</th>
                    <th style="width: 37%;">Data Bulanan</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['tutors'] as $index => $tutor)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $tutor['nama'] }}</td>
                    <td>{{ $tutor['mata_pelajaran'] ?: '-' }}</td>
                    <td style="text-align: center;">{{ $tutor['total_activities'] }}</td>
                    <td style="text-align: center;">{{ $tutor['total_attended'] }}</td>
                    <td style="text-align: center;">
                        @php
                            $percentage = $tutor['overall_percentage'];
                            $class = $percentage >= 80 ? 'percentage-high' : 
                                    ($percentage >= 60 ? 'percentage-medium' : 'percentage-low');
                        @endphp
                        <span class="{{ $class }}">{{ number_format($percentage, 1) }}%</span>
                    </td>
                    <td>
                        @foreach($tutor['monthly_data'] as $month)
                            @if($month['aktivitas'] > 0)
                            <div class="monthly-data">
                                {{ $month['bulan'] }}: {{ $month['hadir'] }}/{{ $month['aktivitas'] }} ({{ number_format($month['persentase'], 1) }}%)
                            </div>
                            @endif
                        @endforeach
                    </td>
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

    <!-- Performance Analysis -->
    <div class="data-section">
        <div class="section-title">Analisis Performa</div>
        @php
            $excellent = collect($data['tutors'])->where('overall_percentage', '>=', 80)->count();
            $good = collect($data['tutors'])->whereBetween('overall_percentage', [60, 79.9])->count();
            $fair = collect($data['tutors'])->whereBetween('overall_percentage', [40, 59.9])->count();
            $poor = collect($data['tutors'])->where('overall_percentage', '<', 40)->count();
        @endphp
        <table class="data-table">
            <thead>
                <tr>
                    <th>Kategori Kehadiran</th>
                    <th>Rentang</th>
                    <th>Jumlah Tutor</th>
                    <th>Persentase</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><span class="percentage-high">Sangat Baik</span></td>
                    <td>≥ 80%</td>
                    <td style="text-align: center;">{{ $excellent }}</td>
                    <td style="text-align: center;">{{ $data['total_records'] > 0 ? number_format(($excellent / $data['total_records']) * 100, 1) : 0 }}%</td>
                </tr>
                <tr>
                    <td><span class="percentage-medium">Baik</span></td>
                    <td>60% - 79%</td>
                    <td style="text-align: center;">{{ $good }}</td>
                    <td style="text-align: center;">{{ $data['total_records'] > 0 ? number_format(($good / $data['total_records']) * 100, 1) : 0 }}%</td>
                </tr>
                <tr>
                    <td><span class="percentage-medium">Cukup</span></td>
                    <td>40% - 59%</td>
                    <td style="text-align: center;">{{ $fair }}</td>
                    <td style="text-align: center;">{{ $data['total_records'] > 0 ? number_format(($fair / $data['total_records']) * 100, 1) : 0 }}%</td>
                </tr>
                <tr>
                    <td><span class="percentage-low">Kurang</span></td>
                    <td>< 40%</td>
                    <td style="text-align: center;">{{ $poor }}</td>
                    <td style="text-align: center;">{{ $data['total_records'] > 0 ? number_format(($poor / $data['total_records']) * 100, 1) : 0 }}%</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>Dokumen ini digenerate secara otomatis pada {{ date('d/m/Y H:i') }}</p>
        <p>Sistem Informasi Manajemen Shelter - {{ $data['shelter'] }}</p>
    </div>
</body>
</html>