<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB; // ← pastikan baris ini ada

class SetupDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:setup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {


    $dbName = config('database.connections.mysql.database');
    
    DB::statement("CREATE DATABASE IF NOT EXISTS `$dbName`");
    $this->info("Database '$dbName' ready.");
    $this->info("Running migrations...");
    
    $this->call('migrate', ['--force' => true]);
    
    $this->info("Done!");
}
    }

