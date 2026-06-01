import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

const ImageWithFallback = ({ src, alt, className = '', fallbackSize = 20, fallback = null }) => {
    const [hasError, setHasError] = useState(false);

    // Reset error state if the src changes (useful for reuse)
    useEffect(() => {
        setHasError(false);
    }, [src]);

    if (!src || hasError) {
        if (fallback) {
            return fallback;
        }
        return (
            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                <ImageOff size={fallbackSize} strokeWidth={1.5} />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={`${className} transition-all duration-300`}
            onError={() => setHasError(true)}
        />
    );
};

export default ImageWithFallback;
