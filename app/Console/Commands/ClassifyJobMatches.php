<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\IntelligentJobMismatchSeeder;

class ClassifyJobMatches extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'job-match:classify {--force : Reclassify all alumni even if recently classified}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Intelligently classify job-education matches for employed alumni using rule-based ML';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $seeder = new IntelligentJobMismatchSeeder();
        $seeder->setCommand($this);
        $seeder->run();
        
        return Command::SUCCESS;
    }
}
