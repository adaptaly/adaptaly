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
    const [file, setFile] = useState<FileData | null>(null);
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

    const processFiles = async (fileList: FileList) => {
        if (fileList.length === 0) return;
        
        // Only take the first file
        const selectedFile = fileList[0];
        const error = validateFile(selectedFile);
        
        if (error) {
            showMessage(error, 'error');
            return;
        }

        const fileData: FileData = {
            file: selectedFile,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        };

        setFile(fileData);
        showMessage(`File "${selectedFile.name}" selected successfully!`, 'success');
        
        // Automatically start upload after a brief delay
        setTimeout(() => {
            handleUpload(fileData);
        }, 1000);
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

    const handleUpload = async (fileData?: FileData) => {
        const targetFile = fileData || file;
        
        if (!targetFile) {
            showMessage('Please select a file to upload.', 'warning');
            return;
        }

        setIsUploading(true);
        
        try {
            // Simulate upload process
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Here you would typically upload the file to your server
            console.log('File to upload:', targetFile.file);
            
            showMessage(`Successfully uploaded "${targetFile.file.name}"!`, 'success');
            
            // Redirect to loading page after successful upload
            setTimeout(() => {
                window.location.href = 'https://www.adaptaly.com/loadingpage';
            }, 1500);
            
        } catch (error) {
            showMessage('Upload failed. Please try again.', 'error');
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

                {file && !isUploading && (
                    <div className="file-list">
                        <div className="file-item">
                            <div className="file-name" title={file.file.name}>
                                {file.file.name}
                            </div>
                            <div className="file-size">
                                {formatFileSize(file.file.size)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadFiles;