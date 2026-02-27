import { useEffect } from 'react';

export default function GoogleCallback() {
    useEffect(() => {
        // Get the code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (window.opener && code) {
            // Send the code back to the opener window
            window.opener.postMessage(
                { type: 'google-auth-code', code },
                window.location.origin
            );
            window.close();
        } else if (window.opener && error) {
            window.opener.postMessage(
                { type: 'google-auth-error', error },
                window.location.origin
            );
            window.close();
        } else {
            console.error('No code found in URL or no opener window');
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <h2 className="mt-4 text-xl font-medium text-gray-900">Google bilan kirish...</h2>
                <p className="mt-2 text-gray-600">Iltimos kuting, oyni avtomatik yopiladi.</p>
            </div>
        </div>
    );
}
