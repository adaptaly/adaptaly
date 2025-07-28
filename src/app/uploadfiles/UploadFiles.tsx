"use client";

import { FunctionComponent, useState, useRef, DragEvent, ChangeEvent } from 'react';
import './UploadFiles.css';

interface FileData {
    file: File;
    id: string;
}

interface Message {
    text: string;
    type: 'error' | 'success' | 'warning';
}

const UploadFiles: FunctionComponent = () => {
    const [files, setFiles] = useState<FileData[]>([]);
    const [message, setMessage] = useState<Message | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB in bytes
    const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

    const showMessage = (text: string, type: Message['type']) => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const validateFile = (file: File): string | null => {
        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return `File "${file.name}" is too large. Maximum size is 300MB.`;
        }

        // Check file type
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
            return `File "${file.name}" is not a supported format. Only PDF, DOCX, and TXT files are allowed.`;
        }

        return null;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const processFiles = (fileList: FileList) => {
        const newFiles: FileData[] = [];
        const errors: string[] = [];

        Array.from(fileList).forEach((file) => {
            const error = validateFile(file);
            if (error) {
                errors.push(error);
            } else {
                // Check if file already exists
                const existingFile = files.find(f => f.file.name === file.name && f.file.size === file.size);
                if (existingFile) {
                    errors.push(`File "${file.name}" is already selected.`);
                } else {
                    newFiles.push({
                        file,
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
                    });
                }
            }
        });

        if (errors.length > 0) {
            showMessage(errors[0], 'error');
        }

        if (newFiles.length > 0) {
            setFiles(prev => [...prev, ...newFiles]);
            showMessage(`${newFiles.length} file(s) added successfully!`, 'success');
        }
    };

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            processFiles(droppedFiles);
        }
    };

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            processFiles(selectedFiles);
        }
        // Reset input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUploadButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
        showMessage('File removed successfully!', 'success');
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            showMessage('Please select at least one file to upload.', 'warning');
            return;
        }

        setIsUploading(true);
        
        try {
            // Simulate upload process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Here you would typically upload files to your server
            console.log('Files to upload:', files.map(f => f.file));
            
            showMessage(`Successfully uploaded ${files.length} file(s)!`, 'success');
            setFiles([]);
        } catch (error) {
            showMessage('Upload failed. Please try again.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="uploadfiles">
            <div className="upload-your-notes-parent">
                <b className="upload-your-notes">Upload your Notes</b>
                
                <div 
                    className={`drag-or-drop-your-files-parent ${isDragOver ? 'drag-over' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <b className="drag-or-drop">
                        {isUploading ? 'Uploading...' : 'Drag or Drop your files'}
                    </b>
                    <b className="or">Or</b>
                    
                    <div className="upload-files-wrapper" onClick={handleUploadButtonClick}>
                        <b className="upload-files">
                            {isUploading ? 'Uploading...' : 'Upload files'}
                        </b>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="file-input"
                            multiple
                            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                            onChange={handleFileInputChange}
                            disabled={isUploading}
                        />
                    </div>

                    {isUploading && (
                        <>
                            <div className="upload-progress">
                                <div className="progress-bar" style={{ width: '100%' }}></div>
                            </div>
                            <div className="uploading-text">Processing...</div>
                        </>
                    )}
                </div>

                <b className="max-size-300">Max size: 300 MB</b>
                <b className="supported-file-types">Supported file types: PDF, DOCX, TXT</b>

                {message && (
                    <div className={`message ${message.type}-message`}>
                        {message.text}
                    </div>
                )}

                {files.length > 0 && (
                    <div className="file-list">
                        {files.map((fileData) => (
                            <div key={fileData.id} className="file-item">
                                <div className="file-name" title={fileData.file.name}>
                                    {fileData.file.name}
                                </div>
                                <div className="file-size">
                                    {formatFileSize(fileData.file.size)}
                                </div>
                                <button
                                    className="remove-file"
                                    onClick={() => removeFile(fileData.id)}
                                    disabled={isUploading}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        
                        {files.length > 0 && !isUploading && (
                            <div style={{ 
                                textAlign: 'center', 
                                marginTop: '12px',
                                paddingTop: '8px',
                                borderTop: '1px solid rgba(255,255,255,0.3)'
                            }}>
                                <button
                                    onClick={handleUpload}
                                    style={{
                                        background: 'rgba(0,0,0,0.6)',
                                        border: '1px solid rgba(255,255,255,0.4)',
                                        color: 'white',
                                        borderRadius: '6px',
                                        padding: '8px 16px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    Upload All Files
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadFiles;