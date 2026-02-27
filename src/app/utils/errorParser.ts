export const parseBackendError = (error: any): string => {
    console.error('Error:', error);

    // Firebase Auth errors
    if (error?.code?.startsWith('auth/')) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'Bu email allaqachon ro\'yxatdan o\'tgan';
            case 'auth/invalid-email':
                return 'Email formati noto\'g\'ri';
            case 'auth/user-not-found':
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
                return 'Email yoki parol noto\'g\'ri';
            case 'auth/weak-password':
                return 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak';
            case 'auth/too-many-requests':
                return 'Juda ko\'p urinish. Iltimos, biroz kuting';
            case 'auth/network-request-failed':
                return 'Internet aloqasida xatolik. Qayta urinib ko\'ring';
            case 'auth/popup-closed-by-user':
                return 'Google kirish oynasi bekor qilindi';
            case 'auth/popup-blocked':
                return 'Popup bloklangan. Brauzer sozlamalarini tekshiring';
            case 'auth/user-disabled':
                return 'Bu hisob bloklangan';
            default:
                return error.message || 'Xatolik yuz berdi';
        }
    }

    // Network/server errors
    if (!error?.response) {
        if (error?.message === 'Network Error' || error?.message?.includes('fetch')) {
            return 'Server bilan aloqa uzildi. Backend serverni ishga tushiring';
        }
        return error?.message || 'Tarmoq xatoligi yuz berdi';
    }

    const data = error?.response?.data;

    // Backend error messages
    if (typeof data?.detail === 'string') return data.detail;
    if (typeof data?.error === 'string') return data.error;
    if (typeof data?.message === 'string') return data.message;

    if (data && typeof data === 'object' && !Array.isArray(data)) {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        if (typeof firstVal === 'string') return firstVal;
        if (Array.isArray(firstVal) && firstVal.length > 0) return String(firstVal[0]);
    }

    return 'Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.';
};
