import fetch from 'node-fetch';

async function fixTranscodeData() {
    try {
        console.log('Fetching Transcodes...');
        const response = await fetch('http://localhost:3001/api/transcodes');
        const data = await response.json();

        if (!data.success) {
            console.error('Failed to fetch transcodes');
            return;
        }

        const srt = data.data.find(t => t.code === 'SRT');
        if (srt) {
            console.log('Found SRT:', srt);
            if (srt.nomortranscode === 1) {
                console.log('Fixing SRT nomortranscode to 6...');
                const updateRes = await fetch(`http://localhost:3001/api/transcodes/${srt.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...srt,
                        nomortranscode: 6
                    })
                });
                const updateData = await updateRes.json();
                console.log('Update result:', updateData);
            } else {
                console.log('SRT nomortranscode is already', srt.nomortranscode);
            }
        } else {
            console.log('SRT not found');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

fixTranscodeData();
