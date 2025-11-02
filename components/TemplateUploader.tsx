
import React, { useState, useCallback } from 'react';
import { Template } from '../types';
import { UploadIcon } from './icons';

// Make pdfjsLib accessible from the window object
declare const pdfjsLib: any;

interface TemplateUploaderProps {
    onTemplateUpload: (template: Template) => void;
}

const TemplateUploader: React.FC<TemplateUploaderProps> = ({ onTemplateUpload }) => {
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setError(null);

        try {
            const url = URL.createObjectURL(file);
            let width = 0, height = 0;

            if (file.type === 'application/pdf') {
                const pdf = await pdfjsLib.getDocument(url).promise;
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1 });
                width = viewport.width;
                height = viewport.height;
            } else if (file.type.startsWith('image/')) {
                const img = new Image();
                const promise = new Promise<{w: number, h: number}>((resolve) => {
                    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
                    img.onerror = () => {
                      setError("Could not load image dimensions.");
                      setIsProcessing(false);
                    };
                    img.src = url;
                });
                const dims = await promise;
                width = dims.w;
                height = dims.h;

            } else {
                throw new Error("Unsupported file type. Please upload a PDF or an image.");
            }
            
            if (width > 0 && height > 0) {
                onTemplateUpload({ file, url, type: file.type, width, height });
            }

        } catch (e: any) {
            setError(e.message || "Failed to process the file.");
        } finally {
            setIsProcessing(false);
        }
    }, [onTemplateUpload]);

    return (
        <div className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4 text-cyan-400">Step 1: Upload Your Template</h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">Upload your certificate, ID card, or document template. Accepted formats are PDF (single page) and images (JPG, PNG).</p>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadIcon className="w-10 h-10 mb-3 text-slate-400"/>
                        <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-slate-500">PDF, PNG, JPG</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="application/pdf,image/png,image/jpeg" disabled={isProcessing} />
                </label>
            </div>
            {isProcessing && <p className="mt-4 text-cyan-400">Processing file...</p>}
            {error && <p className="mt-4 text-red-400">{error}</p>}
        </div>
    );
};

export default TemplateUploader;
