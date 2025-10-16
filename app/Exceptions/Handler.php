<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Inertia\Inertia;
use Illuminate\Auth\AuthenticationException;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    public function render($request, Throwable $exception)
    {       

        if ($exception instanceof AuthenticationException) {
            // Redirect unauthenticated users to the login page
            return $request->expectsJson()
                ? response()->json(['message' => 'Unauthenticated.'], 401)
                : parent::render($request, $exception);
        }

        if (
            $request->expectsJson() ||
            !$request->isMethod('GET') ||
            !app()->environment(['production', 'staging'])
        ) {
            return parent::render($request, $exception);
        }

        $status = $this->isHttpException($exception)
            ? $exception->getStatusCode()
            : 500;

        if (in_array($status, [500, 503, 404, 403, 401, 410, 400])) {
            // Prepare error page data
            $errorData = ['status' => $status];
            
            // Check if there's additional data stored in the session for this error
            if (session()->has('error_page_data')) {
                $additionalData = session()->pull('error_page_data');
                if (is_array($additionalData)) {
                    $errorData = array_merge($errorData, $additionalData);
                }
            }
            
            return Inertia::render('Errors/ErrorPage', $errorData)
                ->toResponse($request)
                ->setStatusCode($status);
        } elseif ($status === 419) {
            return redirect()->back()->with([
                'message' => 'The page expired, please try again.',
            ]);
        }

        return parent::render($request, $exception);
    }
}
