<?php

namespace App\Http\Controllers;

use App\Http\Requests\Booking\StoreBookingRequest;
use App\Models\Booking;
use App\Services\FieldServiceClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BookingController extends Controller
{
    public function __construct(
        private readonly FieldServiceClient $fieldService,
    ) {}

    // User: get own booking history
    public function myBookings(Request $request): JsonResponse
    {
        $userId = $request->input('__auth_user_id');

        $bookings = Booking::byUser($userId)
            ->when($request->query('status'), fn($q, $s) => $q->byStatus($s))
            ->with('payments')
            ->orderByDesc('play_date')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $bookings,
        ]);
    }

    // GET /bookings/:id
    public function show(Request $request, string $id): JsonResponse
    {
        $booking  = Booking::with('payments')->findOrFail($id);
        $userId   = $request->input('__auth_user_id');
        $userRole = $request->input('__auth_user_role');

        // Only the booking owner or owner/admin can view
        if ($userRole === 'user' && ! $booking->isOwnedBy($userId)) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        return response()->json(['success' => true, 'data' => $booking]);
    }

    // User: create a new booking
    public function store(StoreBookingRequest $request): JsonResponse
    {
        $userId = $request->input('__auth_user_id');

        // 1. Fetch slot from Field Service
        $slot = $this->fieldService->getSlot($request->slot_id);
        if (! $slot) {
            return response()->json([
                'success' => false,
                'message' => 'Slot not found or Field Service is unavailable.',
            ], 422);
        }

        // 2. Validate slot is available
        if ($slot['status'] !== 'available') {
            return response()->json([
                'success' => false,
                'message' => 'Slot is not available.',
            ], 422);
        }

        // 3. Check play_date matches slot's day
        $playDate  = \Carbon\Carbon::parse($request->play_date);
        $slotDay   = strtolower($slot['day']);
        $weekdays  = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        $inputDay  = $weekdays[$playDate->dayOfWeek];

        if ($inputDay !== $slotDay) {
            return response()->json([
                'success' => false,
                'message' => "This slot is only available on {$slotDay}.",
            ], 422);
        }

        // 4. Calculate amounts
        $totalPrice = $slot['price'];
        $dpAmount   = round($totalPrice * ($slot['dp_percent'] / 100), 2);
        $remaining  = $totalPrice - $dpAmount;

        DB::beginTransaction();
        try {
            // 5. Create booking record
            $booking = Booking::create([
                'user_id'     => $userId,
                'slot_id'     => $request->slot_id,
                'field_id'    => $request->field_id,
                'play_date'   => $request->play_date,
                'start_time'  => $slot['start_time'],
                'end_time'    => $slot['end_time'],
                'total_price' => $totalPrice,
                'dp_amount'   => $dpAmount,
                'remaining'   => $remaining,
                'status'      => 'pending_dp',
                'notes'       => $request->notes,
                'expires_at'  => now()->addHours(24),
            ]);

            // 6. Lock slot in Field Service
            $locked = $this->fieldService->lockSlot($request->slot_id);
            if (! $locked) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to lock slot. Please try again.',
                ], 503);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Booking created. Please complete your DP payment within 24 hours.',
                'data'    => $booking,
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('BookingController@store: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Internal server error.'], 500);
        }
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $booking  = Booking::findOrFail($id);
        $userId   = $request->input('__auth_user_id');
        $userRole = $request->input('__auth_user_role');

        // Only the booking owner or admin can cancel
        if ($userRole === 'user' && ! $booking->isOwnedBy($userId)) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        if (! $booking->isCancellable()) {
            return response()->json([
                'success' => false,
                'message' => "Booking with status '{$booking->status}' cannot be cancelled.",
            ], 422);
        }

        DB::beginTransaction();
        try {
            $booking->update(['status' => 'cancelled']);
            $this->fieldService->unlockSlot($booking->slot_id);
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Booking cancelled successfully.',
                'data'    => $booking->fresh(),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('BookingController@cancel: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Internal server error.'], 500);
        }
    }

    // Owner: mark booking as done after play session ends
    public function confirm(Request $request, string $id): JsonResponse
    {
        $booking = Booking::findOrFail($id);

        if ($booking->status !== 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Only fully paid bookings can be confirmed as done.',
            ], 422);
        }

        $booking->update([
            'status'       => 'done',
            'confirmed_at' => now(),
        ]);

        // Unlock slot so it can be booked again for the next week
        $this->fieldService->unlockSlot($booking->slot_id);

        return response()->json([
            'success' => true,
            'message' => 'Booking marked as done.',
            'data'    => $booking->fresh(),
        ]);
    }

  public function expireAll(): JsonResponse
    {
        $expired = Booking::expired()->get();
 
        foreach ($expired as $booking) {
            DB::transaction(function () use ($booking) {
                $booking->update(['status' => 'cancelled']);
                $this->fieldService->unlockSlot($booking->slot_id);
            });
        }
 
        return response()->json([
            'success' => true,
            'message' => "{$expired->count()} booking(s) expired and cancelled.",
        ]);
    }


    // Owner: list all bookings across their fields
    public function index(Request $request): JsonResponse
    {
        $ownerId  = $request->input('__auth_user_id');
        $fieldIds = $this->fieldService->getFieldIdsByOwner($ownerId);

        $bookings = Booking::whereIn('field_id', $fieldIds)
            ->when($request->query('status'),   fn($q, $s) => $q->byStatus($s))
            ->when($request->query('field_id'), fn($q, $f) => $q->byField($f))
            ->when($request->query('date'),     fn($q, $d) => $q->whereDate('play_date', $d))
            ->with('payments')
            ->orderByDesc('play_date')
            ->paginate(20);

        return response()->json(['success' => true, 'data' => $bookings]);
    }
}