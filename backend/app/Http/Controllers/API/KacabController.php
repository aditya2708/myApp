<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\KacabResource;
use App\Models\Kacab;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class KacabController extends Controller
{
    /**
     * Display a paginated listing of the kacab resources.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $search = $request->query('search');
        $withLocation = $request->boolean('with_location', true);
        $withCounts = $request->boolean('with_counts', false);

        $query = Kacab::query();

        if ($search) {
            $query->where('nama_kacab', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('no_telp', 'like', "%{$search}%");
        }

        if ($withLocation) {
            $query->with(['provinsi', 'kabupaten', 'kecamatan', 'kelurahan']);
        }

        if ($withCounts) {
            $query->withCount([
                'wilbins',
                'shelters',
                'tutors',
                'donatur',
                'kurikulum',
                'mataPelajaran',
                'jenjang',
            ]);
        }

        $kacabs = $query->orderBy('nama_kacab')
            ->paginate($perPage)
            ->appends($request->query());

        return KacabResource::collection($kacabs)
            ->additional([
                'status' => true,
                'message' => 'Daftar kacab berhasil diambil',
            ])
            ->response()
            ->setStatusCode(200);
    }

    /**
     * Store a newly created kacab resource.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateKacab($request);

        $kacab = new Kacab($validated);

        if (array_key_exists('no_telp', $validated)) {
            $kacab->no_telpon = $validated['no_telp'];
        }

        $kacab->save();
        $kacab->load(['provinsi', 'kabupaten', 'kecamatan', 'kelurahan']);

        return (new KacabResource($kacab))
            ->additional([
                'status' => true,
                'message' => 'Kacab berhasil dibuat',
            ])
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified kacab resource.
     */
    public function show(Kacab $kacab): JsonResponse
    {
        $kacab->load(['provinsi', 'kabupaten', 'kecamatan', 'kelurahan']);

        return (new KacabResource($kacab))
            ->additional([
                'status' => true,
            ])
            ->response()
            ->setStatusCode(200);
    }

    /**
     * Update the specified kacab resource.
     */
    public function update(Request $request, Kacab $kacab): JsonResponse
    {
        $validated = $this->validateKacab($request, $kacab);

        $kacab->fill($validated);
        if (array_key_exists('no_telp', $validated)) {
            $kacab->no_telpon = $validated['no_telp'];
        }
        $kacab->save();
        $kacab->load(['provinsi', 'kabupaten', 'kecamatan', 'kelurahan']);

        return (new KacabResource($kacab))
            ->additional([
                'status' => true,
                'message' => 'Kacab berhasil diperbarui',
            ])
            ->response()
            ->setStatusCode(200);
    }

    /**
     * Remove the specified kacab resource from storage.
     */
    public function destroy(Kacab $kacab): JsonResponse
    {
        if ($kacab->wilbins()->exists() || $kacab->adminCabang()->exists()) {
            return response()->json([
                'status' => false,
                'message' => 'Kacab tidak dapat dihapus karena masih memiliki relasi aktif',
            ], 422);
        }

        $kacab->delete();

        return response()->json([
            'status' => true,
            'message' => 'Kacab berhasil dihapus',
        ]);
    }

    /**
     * Validate request data for creating/updating kacab.
     *
     * @return array<string, mixed>
     */
    private function validateKacab(Request $request, ?Kacab $kacab = null): array
    {
        $id = $kacab?->id_kacab;

        if ($request->filled('no_telpon') && !$request->filled('no_telp')) {
            $request->merge([
                'no_telp' => $request->input('no_telpon'),
            ]);
        }

        $validated = $request->validate([
            'nama_kacab' => 'required|string|max:255',
            'no_telp' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('kacab', 'email')->ignore($id, 'id_kacab'),
            ],
            'id_prov' => 'nullable|string|max:10',
            'id_kab' => 'nullable|string|max:10',
            'id_kec' => 'nullable|string|max:10',
            'id_kel' => 'nullable|string|max:10',
        ]);

        return Arr::only($validated, [
            'nama_kacab',
            'no_telp',
            'alamat',
            'email',
            'id_prov',
            'id_kab',
            'id_kec',
            'id_kel',
        ]);
    }
}

