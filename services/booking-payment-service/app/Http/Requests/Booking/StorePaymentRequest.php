<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'booking_id' => ['required', 'uuid', 'exists:bookings,id'],
            'type'       => ['required', Rule::in(['dp', 'settlement'])],
            'amount'     => ['required', 'numeric', 'min:1'],
            'method'     => ['required', Rule::in(['bank_transfer', 'qris', 'cash'])],
            'proof_url'  => ['nullable', 'url', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'booking_id.exists' => 'Booking not found.',
            'type.in'           => 'Payment type must be dp or settlement.',
            'method.in'         => 'Payment method must be bank_transfer, qris, or cash.',
            'amount.min'        => 'Payment amount must be greater than 0.',
        ];
    }
}