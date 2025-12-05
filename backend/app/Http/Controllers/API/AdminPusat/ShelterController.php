<?php

namespace App\Http\Controllers\API\AdminPusat;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shelter\StoreShelterRequest;
use App\Http\Requests\Shelter\UpdateShelterRequest;
use App\Http\Resources\ShelterResource;
use App\Models\Shelter;
use App\Models\Wilbin;
use App\Support\AdminPusatScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Schema;

class ShelterController extends Controller
{
    use AdminPusatScope;

    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        $companyId = $this->companyId();

        $shelters = $this->applyCompanyScope(Shelter::query(), $companyId, 'shelter')
            ->with(['wilbin.kacab'])
            ->latest('id_shelter')
            ->paginate();

        return ShelterResource::collection($shelters);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreShelterRequest $request)
    {
        $companyId = $this->companyId();
        $data = $request->validated();

        if ($companyId && Schema::hasColumn('wilbin', 'company_id')) {
            Wilbin::where('id_wilbin', $data['id_wilbin'])
                ->where('company_id', $companyId)
                ->firstOrFail();
        }

        if ($companyId && Schema::hasColumn('shelter', 'company_id')) {
            $data['company_id'] = $companyId;
        }

        $shelter = Shelter::create($data);

        return (new ShelterResource($shelter->load(['wilbin.kacab'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Shelter $shelter): ShelterResource
    {
        $companyId = $this->companyId();
        $shelter = $this->applyCompanyScope(Shelter::whereKey($shelter->getKey()), $companyId, 'shelter')
            ->with(['wilbin.kacab'])
            ->firstOrFail();

        $shelter->loadMissing(['wilbin.kacab']);

        return new ShelterResource($shelter);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateShelterRequest $request, Shelter $shelter): ShelterResource
    {
        $companyId = $this->companyId();
        $shelter = $this->applyCompanyScope(Shelter::whereKey($shelter->getKey()), $companyId, 'shelter')->firstOrFail();
        $data = $request->validated();

        if ($companyId && Schema::hasColumn('wilbin', 'company_id')) {
            Wilbin::where('id_wilbin', $data['id_wilbin'])
                ->where('company_id', $companyId)
                ->firstOrFail();
        }

        $shelter->fill($data);
        $shelter->save();

        return new ShelterResource($shelter->fresh()->loadMissing(['wilbin.kacab']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Shelter $shelter): JsonResponse
    {
        $companyId = $this->companyId();
        $shelter = $this->applyCompanyScope(Shelter::whereKey($shelter->getKey()), $companyId, 'shelter')->firstOrFail();

        $shelter->delete();

        return response()->json([
            'message' => 'Shelter berhasil dihapus.',
        ]);
    }
}
