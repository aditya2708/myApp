<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Http\Controllers\API\Base\BaseService;
use App\Http\Middleware\ApiErrorHandler;
use Illuminate\Contracts\Http\Kernel;
use App\Support\SsoContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register BaseService for dependency injection
        $this->app->bind(BaseService::class, function ($app, $parameters) {
            $modelClass = $parameters['modelClass'] ?? null;
            return new BaseService($modelClass);
        });

        // Register BaseService as singleton for shared instances
        $this->app->singleton('base.service', function ($app) {
            return new BaseService(null);
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register API error handling middleware globally for API routes
        $kernel = $this->app->make(Kernel::class);
        
        // Add middleware to API middleware group
        $kernel->appendMiddlewareToGroup('api', ApiErrorHandler::class);
        
        // Register middleware alias for manual usage
        $kernel->appendToMiddlewarePriority(ApiErrorHandler::class);

        // Enforce company scoping for all models that have company_id when SSO context is present
        $tableHasCompany = [];

        Model::addGlobalScope('company_context', function (Builder $builder) use (&$tableHasCompany) {
            if (!app()->bound(SsoContext::class)) {
                return;
            }

            $company = app(SsoContext::class)->company();

            if (!$company) {
                return;
            }

            $table = $builder->getModel()->getTable();

            if (!array_key_exists($table, $tableHasCompany)) {
                $tableHasCompany[$table] = Schema::hasColumn($table, 'company_id');
            }

            if (!$tableHasCompany[$table]) {
                return;
            }

            $builder->where($table.'.company_id', $company->id);
        });

        // Auto-fill company_id on create when the column exists and SSO context provides a company
        Model::creating(function (Model $model) use (&$tableHasCompany) {
            if (!app()->bound(SsoContext::class)) {
                return;
            }

            $company = app(SsoContext::class)->company();

            if (!$company) {
                return;
            }

            $table = $model->getTable();

            if (!array_key_exists($table, $tableHasCompany)) {
                $tableHasCompany[$table] = Schema::hasColumn($table, 'company_id');
            }

            if (!$tableHasCompany[$table]) {
                return;
            }

            if (!$model->getAttribute('company_id')) {
                $model->setAttribute('company_id', $company->id);
            }
        });
    }
}
