<?php

namespace App\Services\AdminCabang\Reports;

use App\Models\AdminCabang;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use RuntimeException;

class TutorFilterHierarchyService
{
    /**
     * Fetch wilayah binaan options for the authenticated admin cabang.
     */
    public function getWilayahOptions(AdminCabang $adminCabang, ?string $search = null): Collection
    {
        $kacab = $adminCabang->kacab;

        if (!$kacab) {
            throw new RuntimeException('Admin cabang tidak memiliki data cabang terkait.');
        }

        $wilbinQuery = $kacab->wilbins()
            ->withCount('shelters')
            ->orderBy('nama_wilbin');

        if ($search) {
            $wilbinQuery->where(function (Builder $query) use ($search) {
                $query->where('nama_wilbin', 'like', '%' . $search . '%');
            });
        }

        return $wilbinQuery
            ->get(['id_wilbin', 'nama_wilbin'])
            ->map(function ($wilbin) {
                return [
                    'id' => (int) $wilbin->id_wilbin,
                    'name' => $wilbin->nama_wilbin,
                    'label' => $wilbin->nama_wilbin,
                    'value' => (string) $wilbin->id_wilbin,
                    'shelter_count' => (int) ($wilbin->shelters_count ?? 0),
                ];
            });
    }

    /**
     * Fetch shelter options for a given wilayah binaan.
     */
    public function getShelterOptions(AdminCabang $adminCabang, int $wilbinId, ?string $search = null): array
    {
        $kacab = $adminCabang->kacab;

        if (!$kacab) {
            throw new RuntimeException('Admin cabang tidak memiliki data cabang terkait.');
        }

        $wilbin = $kacab->wilbins()
            ->where('id_wilbin', $wilbinId)
            ->first();

        if (!$wilbin) {
            throw new RuntimeException('Wilayah binaan tidak ditemukan pada cabang ini.');
        }

        $shelterQuery = $wilbin->shelters()->orderBy('nama_shelter');

        if ($search) {
            $shelterQuery->where(function (Builder $query) use ($search) {
                $query->where('nama_shelter', 'like', '%' . $search . '%');
            });
        }

        $shelters = $shelterQuery
            ->get(['id_shelter', 'nama_shelter'])
            ->map(function ($shelter) use ($wilbin) {
                return [
                    'id' => (int) $shelter->id_shelter,
                    'name' => $shelter->nama_shelter,
                    'label' => $shelter->nama_shelter,
                    'value' => (string) $shelter->id_shelter,
                    'wilbin_id' => (int) $wilbin->id_wilbin,
                    'wilbin_name' => $wilbin->nama_wilbin,
                ];
            })
            ->values();

        return [
            'wilayah' => [
                'id' => (int) $wilbin->id_wilbin,
                'name' => $wilbin->nama_wilbin,
            ],
            'shelters' => $shelters,
        ];
    }
}
