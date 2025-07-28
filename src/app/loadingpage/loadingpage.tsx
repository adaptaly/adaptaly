"use client";

import { FunctionComponent, useState, useEffect } from 'react';
import './loadingpage.css';

const LoadingFiles: FunctionComponent = () => {
    const [progress, setProgress] = useState(0);
    const [currentStatus, setCurrentStatus] = useState('Initializing...');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const statusMessages = [
            { progress: 0, message: 'Initializing...' },
            { progress: 15, message: 'Reading document...' },
            { progress: 35, message: 'Processing content...' },
            { progress: 55, message: 'Extracting key information...' },
            { progress: 75, message: 'Generating insights...' },
            { progress: 90, message: 'Finalizing analysis...' },
            { progress: 100, message: 'Complete!' }
        ];

        let currentMessageIndex = 0;
        
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + (Math.random() * 2 + 0.5); // Smooth increment between 0.5-2.5
                
                // Update status message based on progress
                const nextMessage = statusMessages[currentMessageIndex + 1];
                if (nextMessage && newProgress >= nextMessage.progress) {
                    currentMessageIndex++;
                    setCurrentStatus(nextMessage.message);
                }
                
                // Complete at 100%
                if (newProgress >= 100) {
                    clearInterval(progressInterval);
                    setIsComplete(true);
                    setCurrentStatus('');
                    return 100;
                }
                
                return Math.min(newProgress, 100);
            });
        }, 120); // Smooth animation every 120ms

        // Cleanup interval
        return () => {
            clearInterval(progressInterval);
        };
    }, []);

    return (
        <div className="loadingfiles">
            <div className="loading-files-parent">
                <div className="loading-files">
                    Analyzing Document
                </div>
                
                <div className="status-text">
                    {!isComplete && currentStatus}
                </div>
                
                <div className="frame-child">
                    <div 
                        className="progress-fill" 
                        style={{ 
                            width: `${progress}%`
                        }}
                    />
                </div>

                {!isComplete && (
                    <div className="loading-percentage">
                        {Math.round(progress)}%
                    </div>
                )}

                {isComplete && (
                    <div className="completion-message">
                        <div className="check-icon">✓</div>
                        Analysis Done!
                    </div>
                )}

                {!isComplete && (
                    <div className="loading-dots">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoadingFiles;