<?php

namespace App\Http\Controllers\API\AdminPusat;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shelter\StoreShelterRequest;
use App\Http\Requests\Shelter\UpdateShelterRequest;
use App\Http\Resources\ShelterResource;
use App\Models\Shelter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ShelterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        $shelters = Shelter::query()
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
        $shelter = Shelter::create($request->validated());

        return (new ShelterResource($shelter->load(['wilbin.kacab'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Shelter $shelter): ShelterResource
    {
        $shelter->loadMissing(['wilbin.kacab']);

        return new ShelterResource($shelter);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateShelterRequest $request, Shelter $shelter): ShelterResource
    {
        $shelter->fill($request->validated());
        $shelter->save();

        return new ShelterResource($shelter->fresh()->loadMissing(['wilbin.kacab']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Shelter $shelter): JsonResponse
    {
        $shelter->delete();

        return response()->json([
            'message' => 'Shelter berhasil dihapus.',
        ]);
    }
}
