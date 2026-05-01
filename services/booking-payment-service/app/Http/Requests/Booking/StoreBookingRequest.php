<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'slot_id'   => ['required', 'uuid'],
            'field_id'  => ['required', 'uuid'],
            'play_date' => ['required', 'date', 'after_or_equal:today'],
            'notes'     => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'slot_id.required'   => 'Slot ID is required.',
            'slot_id.uuid'       => 'Slot ID must be a valid UUID.',
            'field_id.required'  => 'Field ID is required.',
            'field_id.uuid'      => 'Field ID must be a valid UUID.',
            'play_date.required' => 'Play date is required.',
            'play_date.date'     => 'Play date must be a valid date.',
            'play_date.after_or_equal' => 'Play date cannot be in the past.',
        ];
    }
}