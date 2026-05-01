<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

  'user_service' => [
        'url'     => env('USER_SERVICE_URL', 'http://localhost:3001'),
        'timeout' => 5, // seconds
    ],
 
    'field_service' => [
        'url'     => env('FIELD_SERVICE_URL', 'http://localhost:3002'),
        'timeout' => 5,
    ],

];
