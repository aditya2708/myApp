<?php

namespace App\Http\Controllers\API\AdminPusat;

use App\Http\Controllers\Controller;
use App\Http\Requests\Wilbin\StoreWilbinRequest;
use App\Http\Requests\Wilbin\UpdateWilbinRequest;
use App\Http\Resources\WilbinResource;
use App\Models\Wilbin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WilbinController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        $wilbins = Wilbin::query()
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
        $wilbin = Wilbin::create($request->validated());

        return (new WilbinResource($wilbin->load('kacab')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Wilbin $wilbin): WilbinResource
    {
        $wilbin->loadMissing('kacab');

        return new WilbinResource($wilbin);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateWilbinRequest $request, Wilbin $wilbin): WilbinResource
    {
        $wilbin->fill($request->validated());
        $wilbin->save();

        return new WilbinResource($wilbin->fresh()->loadMissing('kacab'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Wilbin $wilbin): JsonResponse
    {
        $wilbin->delete();

        return response()->json([
            'message' => 'Wilayah binaan berhasil dihapus.',
        ]);
    }
}
