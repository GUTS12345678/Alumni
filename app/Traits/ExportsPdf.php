<?php

namespace App\Traits;

use Barryvdh\DomPDF\Facade\Pdf;

trait ExportsPdf
{
    /**
     * Render HTML content as a real PDF download using DomPDF.
     *
     * @param string $html      Full HTML document string
     * @param string $filename  Download filename (e.g. "report.pdf")
     * @param string $orientation 'portrait' or 'landscape'
     * @param string $paper     Paper size (default: 'a4')
     * @return \Illuminate\Http\Response
     */
    protected function renderPdf(string $html, string $filename, string $orientation = 'landscape', string $paper = 'a4')
    {
        $pdf = Pdf::loadHTML($html);
        $pdf->setPaper($paper, $orientation);
        $pdf->setOption('isHtml5ParserEnabled', true);
        $pdf->setOption('isRemoteEnabled', true);
        $pdf->setOption('defaultFont', 'Arial');

        return $pdf->download($filename);
    }
}
