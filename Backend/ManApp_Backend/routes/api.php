<?php

use App\Http\Controllers\EventController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
Route::post('/user/push-token', [UserController::class, 'savePushToken']);

Route::post('login', [UserController::class, 'login']);
Route::post('files/upload', [FileController::class, 'upload']);
Route::patch('files/status', [FileController::class, 'updateStatus']);
Route::apiResource('users', UserController::class);
Route::apiResource('events', EventController::class);
Route::apiResource('files', FileController::class);
