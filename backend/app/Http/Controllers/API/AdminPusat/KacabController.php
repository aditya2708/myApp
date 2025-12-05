<?php

namespace App\Http\Controllers\API\AdminPusat;

use App\Http\Controllers\Controller;
use App\Http\Requests\Kacab\StoreKacabRequest;
use App\Http\Requests\Kacab\UpdateKacabRequest;
use App\Http\Resources\KacabResource;
use App\Models\Kacab;
use App\Support\AdminPusatScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Schema;

class KacabController extends Controller
{
    use AdminPusatScope;

    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        $companyId = $this->companyId();

        $kacab = $this->applyCompanyScope(Kacab::query(), $companyId, 'kacab')
            ->latest('id_kacab')
            ->paginate();

        return KacabResource::collection($kacab);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreKacabRequest $request)
    {
        $data = $request->validated();
        $companyId = $this->companyId();

        if (!empty($data['no_telpon']) && empty($data['no_telp'])) {
            $data['no_telp'] = $data['no_telpon'];
        } elseif (!empty($data['no_telp']) && empty($data['no_telpon'])) {
            $data['no_telpon'] = $data['no_telp'];
        }

        if ($companyId && Schema::hasColumn('kacab', 'company_id')) {
            $data['company_id'] = $companyId;
        }

        $kacab = Kacab::create($data);

        return (new KacabResource($kacab->fresh()))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Kacab $kacab): KacabResource
    {
        $companyId = $this->companyId();
        $kacab = $this->applyCompanyScope(Kacab::whereKey($kacab->getKey()), $companyId, 'kacab')->firstOrFail();

        return new KacabResource($kacab);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateKacabRequest $request, Kacab $kacab): KacabResource
    {
        $companyId = $this->companyId();
        $kacab = $this->applyCompanyScope(Kacab::whereKey($kacab->getKey()), $companyId, 'kacab')->firstOrFail();

        $data = $request->validated();

        if (!empty($data['no_telpon']) && empty($data['no_telp'])) {
            $data['no_telp'] = $data['no_telpon'];
        } elseif (!empty($data['no_telp']) && empty($data['no_telpon'])) {
            $data['no_telpon'] = $data['no_telp'];
        }

        $kacab->fill($data);
        $kacab->save();

        return new KacabResource($kacab->fresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Kacab $kacab): JsonResponse
    {
        $companyId = $this->companyId();
        $kacab = $this->applyCompanyScope(Kacab::whereKey($kacab->getKey()), $companyId, 'kacab')->firstOrFail();

        $kacab->delete();

        return response()->json([
            'message' => 'Kepala cabang berhasil dihapus.',
        ]);
    }
}
