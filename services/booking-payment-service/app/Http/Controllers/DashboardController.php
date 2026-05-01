<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
use App\Services\FieldServiceClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly FieldServiceClient $fieldService,
    ) {}

    // Owner: all bookings for today across their fields
    public function today(Request $request): JsonResponse
    {
        $ownerId  = $request->input('__auth_user_id');
        $fieldIds = $this->fieldService->getFieldIdsByOwner($ownerId);

         if (empty($fieldIds)) {
        return response()->json([
            'debug'    => true,
            'owner_id' => $ownerId,
            'field_ids'=> $fieldIds,
            'message'  => 'No fields found for this owner',
        ]);
    }

        $bookings = Booking::whereIn('field_id', $fieldIds)
            ->whereDate('play_date', today())
            ->with('payments')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'date'          => today()->toDateString(),
                'total'         => $bookings->count(),
                'bookings'      => $bookings,
            ],
        ]);
    }
    
    // Owner: revenue report grouped by date
    // Query params: ?from=2026-05-01 &to=2026-05-31 &field_id=xxx
    public function revenue(Request $request): JsonResponse
    {
        $request->validate([
            'from'     => ['nullable', 'date'],
            'to'       => ['nullable', 'date', 'after_or_equal:from'],
            'field_id' => ['nullable', 'uuid'],
        ]);

        $ownerId  = $request->input('__auth_user_id');
        $fieldIds = $this->fieldService->getFieldIdsByOwner($ownerId);

        // If a specific field is requested, ensure it belongs to owner
        if ($request->field_id) {
            if (! in_array($request->field_id, $fieldIds)) {
                return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
            }
            $fieldIds = [$request->field_id];
        }

        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to   ?? now()->endOfMonth()->toDateString();

        // Revenue per day
        $daily = Payment::query()
            ->join('bookings', 'payments.booking_id', '=', 'bookings.id')
            ->whereIn('bookings.field_id', $fieldIds)
            ->where('payments.status', 'verified')
            ->whereBetween('payments.verified_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
            ->selectRaw('
                DATE(payments.verified_at) as date,
                COUNT(DISTINCT bookings.id) as total_bookings,
                SUM(payments.amount) as total_revenue,
                SUM(CASE WHEN payments.type = "dp" THEN payments.amount ELSE 0 END) as dp_revenue,
                SUM(CASE WHEN payments.type = "settlement" THEN payments.amount ELSE 0 END) as settlement_revenue
            ')
            ->groupByRaw('DATE(payments.verified_at)')
            ->orderBy('date')
            ->get();

        $summary = [
            'from'             => $from,
            'to'               => $to,
            'total_revenue'    => $daily->sum('total_revenue'),
            'total_bookings'   => $daily->sum('total_bookings'),
        ];

        return response()->json([
            'success' => true,
            'data'    => [
                'summary' => $summary,
                'daily'   => $daily,
            ],
        ]);
    }

  
    // Owner: payments awaiting verification
    public function pending(Request $request): JsonResponse
    {
        $ownerId  = $request->input('__auth_user_id');
        $fieldIds = $this->fieldService->getFieldIdsByOwner($ownerId);

        $payments = Payment::query()
            ->join('bookings', 'payments.booking_id', '=', 'bookings.id')
            ->whereIn('bookings.field_id', $fieldIds)
            ->where('payments.status', 'pending')
            ->select('payments.*', 'bookings.play_date', 'bookings.field_id', 'bookings.user_id')
            ->orderBy('payments.created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'total'    => $payments->count(),
                'payments' => $payments,
            ],
        ]);
    }
}