<?php

namespace App\Http\Controllers;

use App\Http\Requests\Booking\StoreBookingRequest;
use App\Models\Booking;
use App\Services\FieldServiceClient;
use App\Services\UserServiceClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BookingController extends Controller
{
    public function __construct(
        private readonly FieldServiceClient $fieldService,
        private readonly UserServiceClient  $userService,
    ) {}

    private function isOwnerOfBooking(Booking $booking, string $ownerId): bool
    {
        $fieldIds = $this->fieldService->getFieldIdsByOwner($ownerId);
        return in_array($booking->field_id, $fieldIds);
    }

    private function formatBooking(Booking $booking, ?string $userName, ?string $fieldName): array
    {
        return [
            'id'           => $booking->id,
            'user_id'      => $booking->user_id,
            'user_name'    => $userName,
            'slot_id'      => $booking->slot_id,
            'field_id'     => $booking->field_id,
            'field_name'   => $fieldName,
            'play_date'    => $booking->play_date,
            'start_time'   => $booking->start_time,
            'end_time'     => $booking->end_time,
            'total_price'  => $booking->total_price,
            'dp_amount'    => $booking->dp_amount,
            'remaining'    => $booking->remaining,
            'status'       => $booking->status,
            'notes'        => $booking->notes,
            'expires_at'   => $booking->expires_at,
            'confirmed_at' => $booking->confirmed_at,
            'created_at'   => $booking->created_at,
            'updated_at'   => $booking->updated_at,
            'payments'     => $booking->payments,
        ];
    }

    // ── GET /bookings/me ──────────────────────────────────────
    // User: riwayat booking milik sendiri
    public function myBookings(Request $request): JsonResponse
    {
        $userId = $request->input('__auth_user_id');

        $bookings = Booking::byUser($userId)
            ->when($request->query('status'), fn($q, $s) => $q->byStatus($s))
            ->with('payments')
            ->orderByDesc('play_date')
            ->paginate(15);

        // Enrich dengan field_name
        $uniqueFieldIds = $bookings->pluck('field_id')->unique()->values();
        $fieldMap = $uniqueFieldIds->mapWithKeys(fn($id) => [
            $id => $this->fieldService->getField($id),
        ]);

        $enriched = $bookings->through(fn($booking) => $this->formatBooking(
            $booking,
            null,
            $fieldMap[$booking->field_id]['name'] ?? null,
        ));

        return response()->json([
            'success' => true,
            'data'    => $enriched,
        ]);
    }

    // ── GET /bookings/:id ─────────────────────────────────────
    public function show(Request $request, string $id): JsonResponse
    {
        $booking  = Booking::with('payments')->findOrFail($id);
        $userId   = $request->input('__auth_user_id');
        $userRole = $request->input('__auth_user_role');

        // User hanya bisa lihat booking miliknya sendiri
        if ($userRole === 'user' && ! $booking->isOwnedBy($userId)) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        // Owner hanya bisa lihat booking di lapangannya
        if ($userRole === 'owner' && ! $this->isOwnerOfBooking($booking, $userId)) {
            return response()->json(['success' => false, 'message' => 'Forbidden. This booking is not from your field.'], 403);
        }

        // Enrich dengan user_name dan field_name
        $user  = $this->userService->getUser($booking->user_id);
        $field = $this->fieldService->getField($booking->field_id);

        return response()->json([
            'success' => true,
            'data'    => $this->formatBooking(
                $booking,
                $user['name']  ?? null,
                $field['name'] ?? null,
            ),
        ]);
    }


    // User: buat booking baru
    public function store(StoreBookingRequest $request): JsonResponse
    {
        $userId = $request->input('__auth_user_id');

        // 1. Ambil slot dari Field Service
        $slot = $this->fieldService->getSlot($request->slot_id);
        if (! $slot) {
            return response()->json([
                'success' => false,
                'message' => 'Slot not found or Field Service is unavailable.',
            ], 422);
        }

        // 2. Pastikan slot masih available
        if ($slot['status'] !== 'available') {
            return response()->json([
                'success' => false,
                'message' => 'Slot is not available.',
            ], 422);
        }

        // 3. Pastikan play_date sesuai dengan hari slot
        $playDate = \Carbon\Carbon::parse($request->play_date);
        $slotDay  = strtolower($slot['day']);
        $weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        $inputDay = $weekdays[$playDate->dayOfWeek];

        if ($inputDay !== $slotDay) {
            return response()->json([
                'success' => false,
                'message' => "This slot is only available on {$slotDay}.",
            ], 422);
        }

        // 4. Hitung total, DP, dan sisa
        $totalPrice = $slot['price'];
        $dpAmount   = round($totalPrice * ($slot['dp_percent'] / 100), 2);
        $remaining  = $totalPrice - $dpAmount;

        DB::beginTransaction();
        try {
            // 5. Simpan booking
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

            // 6. Kunci slot di Field Service
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
                'success'    => true,
                'message'    => 'Booking created. Please complete your DP payment within 24 hours.',
                'booking_id' => $booking->id,
                'data'       => $booking,
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

        // User hanya bisa cancel booking miliknya
        if ($userRole === 'user' && ! $booking->isOwnedBy($userId)) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        // Owner hanya bisa cancel booking di lapangannya sendiri
        if ($userRole === 'owner' && ! $this->isOwnerOfBooking($booking, $userId)) {
            return response()->json(['success' => false, 'message' => 'Forbidden. This booking is not from your field.'], 403);
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


    // Owner: tandai booking selesai setelah sesi main berakhir
    public function confirm(Request $request, string $id): JsonResponse
    {
        $booking  = Booking::findOrFail($id);
        $ownerId  = $request->input('__auth_user_id');
        $userRole = $request->input('__auth_user_role');

        // Owner hanya bisa confirm booking di lapangannya sendiri
        if ($userRole === 'owner' && ! $this->isOwnerOfBooking($booking, $ownerId)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. This booking is not from your field.',
            ], 403);
        }

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

        $this->fieldService->unlockSlot($booking->slot_id);

        return response()->json([
            'success' => true,
            'message' => 'Booking marked as done.',
            'data'    => $booking->fresh(),
        ]);
    }


    // Admin: manual trigger auto-expire
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


    // Owner: list semua booking di lapangan miliknya
    public function index(Request $request): JsonResponse
    {
        $ownerId  = $request->input('__auth_user_id');
        $fieldIds = $this->fieldService->getFieldIdsByOwner($ownerId);

        if (empty($fieldIds)) {
            return response()->json([
                'success' => true,
                'message' => 'You have no fields registered.',
                'data'    => [],
            ]);
        }

        $bookings = Booking::whereIn('field_id', $fieldIds)
            ->when($request->query('status'),   fn($q, $s) => $q->byStatus($s))
            ->when($request->query('field_id'), fn($q, $f) => $q->byField($f))
            ->when($request->query('date'),     fn($q, $d) => $q->whereDate('play_date', $d))
            ->with('payments')
            ->orderByDesc('play_date')
            ->paginate(20);

        // Enrich dengan user_name dan field_name
        $uniqueUserIds  = $bookings->pluck('user_id')->unique()->values();
        $uniqueFieldIds = $bookings->pluck('field_id')->unique()->values();

        $userMap = $uniqueUserIds->mapWithKeys(fn($id) => [
            $id => $this->userService->getUser($id),
        ]);

        $fieldMap = $uniqueFieldIds->mapWithKeys(fn($id) => [
            $id => $this->fieldService->getField($id),
        ]);

        $enriched = $bookings->through(fn($booking) => $this->formatBooking(
            $booking,
            $userMap[$booking->user_id]['name']   ?? null,
            $fieldMap[$booking->field_id]['name'] ?? null,
        ));

        return response()->json(['success' => true, 'data' => $enriched]);
    }
}