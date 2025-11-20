<?php

/**
 * Laravel Application Entry Point Redirect
 * 
 * This file redirects all requests to the public folder
 * where the actual Laravel application resides.
 */

header('Location: /public/index.php');
exit;
