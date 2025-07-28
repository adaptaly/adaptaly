"use client";

import { FunctionComponent, useState, useEffect } from 'react';
import './loadingpage.css';

const LoadingFiles: FunctionComponent = () => {
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState('Loading Files');

    useEffect(() => {
        // Progress animation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                // Simulate realistic loading progress with varying speeds
                const increment = Math.random() * 3 + 1; // Random increment between 1-4
                return Math.min(prev + increment, 100);
            });
        }, 150);

        // Loading text animation
        const textMessages = [
            'Loading Files',
            'Processing Document',
            'Analyzing Content',
            'Preparing Summary',
            'Almost Ready'
        ];

        let messageIndex = 0;
        const textInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % textMessages.length;
            setLoadingText(textMessages[messageIndex]);
        }, 2000);

        // Cleanup intervals
        return () => {
            clearInterval(progressInterval);
            clearInterval(textInterval);
        };
    }, []);

    // Loading dots animation for the text
    const renderLoadingText = () => {
        const dots = progress < 100 ? '.'.repeat((Math.floor(Date.now() / 500) % 4)) : '...';
        return `${loadingText}${dots}`;
    };

    return (
        <div className="loadingfiles">
            <div className="loading-files-parent">
                <b className="loading-files">{renderLoadingText()}</b>
                
                <div className="frame-child">
                    <div 
                        className="progress-fill" 
                        style={{ 
                            width: `${progress}%`,
                            animation: progress >= 100 ? 'none' : undefined
                        }}
                    />
                </div>

                <div className="loading-percentage">
                    {Math.round(progress)}%
                </div>

                {progress < 100 && (
                    <div className="loading-dots">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                )}

                {progress >= 100 && (
                    <div style={{
                        position: 'absolute',
                        top: '150px',
                        left: 'calc(50% - 30px)',
                        fontSize: '14px',
                        color: 'white',
                        fontWeight: 'bold',
                        animation: 'fadeIn 0.5s ease-in'
                    }}>
                        Complete! ✓
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default LoadingFiles;