<?php

namespace App\Http\Controllers\API\AdminPusat;

use App\Http\Controllers\Controller;
use App\Http\Requests\Wilbin\StoreWilbinRequest;
use App\Http\Requests\Wilbin\UpdateWilbinRequest;
use App\Http\Resources\WilbinResource;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Support\AdminPusatScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Schema;

class WilbinController extends Controller
{
    use AdminPusatScope;

    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        $companyId = $this->companyId();

        $wilbins = $this->applyCompanyScope(Wilbin::query(), $companyId, 'wilbin')
            ->with('kacab')
            ->latest('id_wilbin')
            ->paginate();

        return WilbinResource::collection($wilbins);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreWilbinRequest $request)
    {
        $companyId = $this->companyId();
        $data = $request->validated();

        // Pastikan kacab terkait sesuai company
        if ($companyId && Schema::hasColumn('kacab', 'company_id')) {
            Kacab::where('id_kacab', $data['id_kacab'])
                ->where('company_id', $companyId)
                ->firstOrFail();
        }

        if ($companyId && Schema::hasColumn('wilbin', 'company_id')) {
            $data['company_id'] = $companyId;
        }

        $wilbin = Wilbin::create($data);

        return (new WilbinResource($wilbin->load('kacab')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Wilbin $wilbin): WilbinResource
    {
        $companyId = $this->companyId();
        $wilbin = $this->applyCompanyScope(Wilbin::whereKey($wilbin->getKey()), $companyId, 'wilbin')
            ->with('kacab')
            ->firstOrFail();

        $wilbin->loadMissing('kacab');

        return new WilbinResource($wilbin);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateWilbinRequest $request, Wilbin $wilbin): WilbinResource
    {
        $companyId = $this->companyId();
        $wilbin = $this->applyCompanyScope(Wilbin::whereKey($wilbin->getKey()), $companyId, 'wilbin')->firstOrFail();
        $data = $request->validated();

        if ($companyId && Schema::hasColumn('kacab', 'company_id')) {
            Kacab::where('id_kacab', $data['id_kacab'])
                ->where('company_id', $companyId)
                ->firstOrFail();
        }

        $wilbin->fill($data);
        $wilbin->save();

        return new WilbinResource($wilbin->fresh()->loadMissing('kacab'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Wilbin $wilbin): JsonResponse
    {
        $companyId = $this->companyId();
        $wilbin = $this->applyCompanyScope(Wilbin::whereKey($wilbin->getKey()), $companyId, 'wilbin')->firstOrFail();

        $wilbin->delete();

        return response()->json([
            'message' => 'Wilayah binaan berhasil dihapus.',
        ]);
    }
}
