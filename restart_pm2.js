const { exec } = require('child_process');
exec('npm run build', (error, stdout, stderr) => {
    if (error) {
        console.error(`Status: error: ${error.message}`);
        return;
    }
    console.log('Status: success');
});
