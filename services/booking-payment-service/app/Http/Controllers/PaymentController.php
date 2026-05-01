<?php

namespace App\Http\Controllers;

use App\Http\Requests\Payment\StorePaymentRequest;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function store(StorePaymentRequest $request): JsonResponse
    {
        $userId  = $request->input('__auth_user_id');
        $booking = Booking::findOrFail($request->booking_id);

        // Only the booking owner can upload payment
        if (! $booking->isOwnedBy($userId)) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        // Validate payment type vs booking status
        if ($request->type === 'dp' && $booking->status !== 'pending_dp') {
            return response()->json([
                'success' => false,
                'message' => "DP payment is not applicable. Booking status is '{$booking->status}'.",
            ], 422);
        }

        if ($request->type === 'settlement' && $booking->status !== 'dp_paid') {
            return response()->json([
                'success' => false,
                'message' => "Settlement payment is only allowed after DP is verified. Booking status is '{$booking->status}'.",
            ], 422);
        }

        // Prevent duplicate pending payment for the same type
        $existing = Payment::where('booking_id', $booking->id)
            ->where('type', $request->type)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'A pending payment of this type already exists. Wait for owner verification.',
            ], 422);
        }

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'type'       => $request->type,
            'amount'     => $request->amount,
            'method'     => $request->method,
            'proof_url'  => $request->proof_url,
            'status'     => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment proof uploaded. Waiting for owner verification.',
            'data'    => $payment,
        ], 201);
    }

    // Get all payments for a booking
    public function index(Request $request, string $bookingId): JsonResponse
    {
        $booking  = Booking::findOrFail($bookingId);
        $userId   = $request->input('__auth_user_id');
        $userRole = $request->input('__auth_user_role');

        if ($userRole === 'user' && ! $booking->isOwnedBy($userId)) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        $payments = Payment::where('booking_id', $bookingId)
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $payments,
        ]);
    }

    // Owner: verify payment and update booking status accordingly
    public function verify(Request $request, string $id): JsonResponse
    {
        $payment  = Payment::with('booking')->findOrFail($id);
        $ownerId  = $request->input('__auth_user_id');

        if ($payment->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Payment already {$payment->status}.",
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Mark payment as verified
            $payment->update([
                'status'      => 'verified',
                'verified_by' => $ownerId,
                'verified_at' => now(),
            ]);

            $booking    = $payment->booking;
            $newStatus  = match ($payment->type) {
                'dp'         => 'dp_paid',
                'settlement' => 'paid',
            };

            $bookingUpdates = ['status' => $newStatus];

            if ($payment->type === 'settlement') {
                $bookingUpdates['remaining'] = 0;
            }

            $booking->update($bookingUpdates);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Payment verified. Booking status updated to '{$newStatus}'.",
                'data'    => [
                    'payment' => $payment->fresh(),
                    'booking' => $booking->fresh(),
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('PaymentController@verify: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Internal server error.'], 500);
        }
    }

   
    // Owner: reject payment with a reason
    public function reject(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'reject_note' => ['required', 'string', 'max:500'],
        ]);

        $payment = Payment::findOrFail($id);

        if ($payment->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Payment already {$payment->status}.",
            ], 422);
        }

        $payment->update([
            'status'      => 'rejected',
            'reject_note' => $request->reject_note,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment rejected.',
            'data'    => $payment->fresh(),
        ]);
    }
}