<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan CPB - {{ $data['shelter'] }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 20px;
            color: #333;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .header .subtitle {
            margin: 5px 0;
            font-size: 14px;
            color: #7f8c8d;
        }
        
        .info-section {
            margin-bottom: 20px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        
        .info-label {
            font-weight: bold;
            width: 30%;
        }
        
        .summary-section {
            margin-bottom: 25px;
        }
        
        .summary-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .summary-card {
            background: #fff;
            border: 1px solid #ddd;
            padding: 10px;
            text-align: center;
            border-radius: 5px;
        }
        
        .summary-value {
            font-size: 16px;
            font-weight: bold;
            color: #9b59b6;
            margin-bottom: 5px;
        }
        
        .summary-label {
            font-size: 10px;
            color: #666;
        }
        
        .data-section {
            margin-top: 20px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #2c3e50;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .data-table th,
        .data-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            font-size: 10px;
        }
        
        .data-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .data-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .status-badge {
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            color: white;
        }
        
        .status-bcpb { background-color: #e67e22; }
        .status-cpb { background-color: #3498db; }
        .status-npb { background-color: #95a5a6; }
        .status-pb { background-color: #27ae60; }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #7f8c8d;
            border-top: 1px solid #eee;
            padding-top: 15px;
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
        <h1>LAPORAN CALON PENERIMA BEASISWA (CPB)</h1>
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
            <span class="info-label">Status Filter:</span>
            <span>{{ $data['filters']['status'] ? $data['filters']['status'] : 'Semua Status' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Total Data:</span>
            <span>{{ $data['total_records'] }} anak</span>
        </div>
    </div>

    <!-- Summary Section -->
    <div class="summary-section">
        <div class="summary-title">Ringkasan Data CPB</div>
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-value">{{ $data['summary']['BCPB'] }}</div>
                <div class="summary-label">BCPB</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">{{ $data['summary']['CPB'] }}</div>
                <div class="summary-label">CPB</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">{{ $data['summary']['NPB'] }}</div>
                <div class="summary-label">NPB</div>
            </div>
            <div class="summary-card">
                <div class="summary-value">{{ $data['summary']['PB'] }}</div>
                <div class="summary-label">PB</div>
            </div>
        </div>
    </div>

    <!-- Data Table -->
    <div class="data-section">
        <div class="section-title">
            Daftar Anak Binaan
            @if($data['filters']['status'])
                - Status {{ $data['filters']['status'] }}
            @endif
        </div>
        
        @if(count($data['children']) > 0)
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 5%;">No</th>
                    <th style="width: 20%;">Nama Lengkap</th>
                    <th style="width: 12%;">Panggilan</th>
                    <th style="width: 8%;">JK</th>
                    <th style="width: 6%;">Umur</th>
                    <th style="width: 8%;">Kelas</th>
                    <th style="width: 12%;">Status Ortu</th>
                    <th style="width: 8%;">Status CPB</th>
                    <th style="width: 10%;">Tgl Daftar</th>
                    <th style="width: 11%;">Tgl Sponsor</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['children'] as $index => $child)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $child['nama_lengkap'] }}</td>
                    <td>{{ $child['nama_panggilan'] ?: '-' }}</td>
                    <td>{{ $child['jenis_kelamin'] === 'Laki-laki' ? 'L' : 'P' }}</td>
                    <td>{{ $child['umur'] ?: '-' }}</td>
                    <td>{{ $child['kelas'] ?: '-' }}</td>
                    <td>{{ $child['status_orang_tua'] ?: '-' }}</td>
                    <td>
                        <span class="status-badge status-{{ strtolower($child['status_cpb']) }}">
                            {{ $child['status_cpb'] }}
                        </span>
                    </td>
                    <td>{{ $child['tanggal_daftar'] ? date('d/m/Y', strtotime($child['tanggal_daftar'])) : '-' }}</td>
                    <td>{{ $child['tanggal_sponsorship'] ? date('d/m/Y', strtotime($child['tanggal_sponsorship'])) : '-' }}</td>
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

    <!-- Footer -->
    <div class="footer">
        <p>Dokumen ini digenerate secara otomatis pada {{ date('d/m/Y H:i') }}</p>
        <p>Sistem Informasi Manajemen Shelter - {{ $data['shelter'] }}</p>
    </div>
</body>
</html>